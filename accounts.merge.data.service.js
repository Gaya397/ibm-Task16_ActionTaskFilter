module.exports = AccountsMergeDataService;

const angular = require('angular');

AccountsMergeDataService.$inject = ['$log', '$q', 'CognosDimentionService', 'utilsService', 'CognosService', 'UserSettingsService'];

/**
 *  This component is responsible for transforming the data recieved from cognos to a UI friendly structure
 */
function AccountsMergeDataService($log, $q, CognosDimentionService, utilsService, CognosService, UserSettingsService) {
  this.mergeAccountAdjustments = mergeAccountAdjustments;
  this.calculateOWRisks = calculateOWRisks;
  this.calculateAccountRoadmap = calculateAccountRoadmap;
  this.sumTotalAccountAdjustments = sumTotalAccountAdjustments;
  this.mergeAccountRevenueData = mergeAccountRevenueData;
  this.mergeDataSource = mergeDataSource;
  this.mergeRevenueDataOPTIMIZATION = mergeRevenueDataOPTIMIZATION;

  this.convertEditItemToUiModel = convertEditItemToUiModel;
  this.convertUiModelToEditItem = convertUiModelToEditItem;
  this.convertUiModelToEditItemAccountAdjustment = convertUiModelToEditItemAccountAdjustment;
  this.mergeSourceDataForPopup = mergeSourceDataForPopup;
  this.getMapKey = getMapKey;

  let columnNames = CognosDimentionService.columns.RR_INPUT;
  const backlogSuffix = UserSettingsService.isEuGtsRegion() ? '' : 'Backlog';
  if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
    columnNames = CognosDimentionService.columns.RR_ROADMAP_TYPE_DIMENSION;
  }

  function setDefaultCGPProcents(revenueData) {
    if (typeof revenueData.prevCGPProcents === 'undefined') {
      revenueData.prevCGPProcents = { value: 0 };
    }
    if (typeof revenueData.cGPProcents === 'undefined') {
      revenueData.cGPProcents = { value: 0 };
    }
  }

  function mergeAccountRevenueData(accountData, revenueData, riskCategory) {
    const revenueHashMap = {};
    revenueData.forEach((line) => {
      const hashCode = getMapKeyInternal(line);
      revenueHashMap[hashCode] = {
        code: hashCode,
        line,
      };
    });

    accountData.forEach((line) => {
      const hashCode = getMapKeyInternal(line);
      const revData = revenueHashMap[hashCode];
      if (typeof revData !== 'undefined') {
        mergeObjects(line.bestCanDoCurrentWeek, revData.line.bestCanDoCurrentWeek);
        mergeObjects(line.commitCurrentWeek, revData.line.commitCurrentWeek);
        mergeObjects(line.bestCanDoPrevWeek, revData.line.bestCanDoPrevWeek);
        mergeObjects(line.commitPrevWeek, revData.line.commitPrevWeek);
      }
      let riskCategoryName = 'bestCanDo';
      if (riskCategory === 'Commit') {
        riskCategoryName = 'commit';
      }
      mergeRevenueDataOPTIMIZATION(line, riskCategoryName);
      mergeRevenueDataOPTIMIZATION(line, riskCategoryName, 'solid');
      mergeRevenueDataOPTIMIZATION(line, riskCategoryName, 'risk');
      delete line.commitCurrentWeek_props;
      delete line.bestCanDoCurrentWeek_props;
      delete line.commitPrevWeek_props;
      delete line.bestCanDoPrevWeek_props;
      delete line.solidCurrentWeek_props;
      delete line.riskCurrentWeek_props;
      delete line.stretchCurrentWeek_props;
      delete line.solidPrevWeek_props;
      delete line.riskPrevWeek_props;
      delete line.stretchPrevWeek_props;
    });

    function mergeObjects(toObj, data) {
      if (!toObj || !data) {
        return;
      }
      for (const key in data) {
        toObj[key] = data[key];
      }
    }

    function getMapKeyInternal(line) {
      if (!line.account) {
        console.trace();
        throw new Error('Invalid account object');
      }
      if (!line.serviceLine) {
        throw new Error('Invalid service line object');
      }
      if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
        if (typeof line.approval === 'undefined') {
          throw new Error('Invalid approval object');
        }
        return `${line.account.Name}_${line.approval.Name}_${line.serviceLine.Name}`;
      }
      return `${line.account.Name}_${line.serviceLine.Name}`;
    }
  }

  function mergeRevenueDataOPTIMIZATION(line, riskCategory, riskCategoryName) {
    let revenueData = line;
    if (riskCategoryName) {
      riskCategory = riskCategoryName;
      if (typeof line[riskCategoryName] === 'undefined') {
        line[riskCategoryName] = {};
      }
      revenueData = line[riskCategoryName];
    }

    if (typeof line[`${riskCategory}CurrentWeek`] !== 'undefined') {
      revenueData.month1 = {
        revenue: line[`${riskCategory}CurrentWeek`].M1_Rev,
        cost: line[`${riskCategory}CurrentWeek`].M1_Cost,
        cGPAmount: line[`${riskCategory}CurrentWeek`].M1_cGP$,
        cGPProcents: line[`${riskCategory}CurrentWeek`]['M1_cGP%'],
      };
      if (typeof line[`${riskCategory}PrevWeek`] !== 'undefined') {
        revenueData.month1.prevRevenue = line[`${riskCategory}PrevWeek`].M1_Rev;
        revenueData.month1.prevCost = line[`${riskCategory}PrevWeek`].M1_Cost;
        revenueData.month1.prevCGPAmount = line[`${riskCategory}PrevWeek`].M1_cGP$;
        revenueData.month1.prevCGPProcents = line[`${riskCategory}PrevWeek`]['M1_cGP%'];
      }
      setDefaultCGPProcents(revenueData.month1);
      revenueData.month2 = {
        revenue: line[`${riskCategory}CurrentWeek`].M2_Rev,
        cost: line[`${riskCategory}CurrentWeek`].M2_Cost,
        cGPAmount: line[`${riskCategory}CurrentWeek`].M2_cGP$,
        cGPProcents: line[`${riskCategory}CurrentWeek`]['M2_cGP%'],
      };
      if (typeof line[`${riskCategory}PrevWeek`] !== 'undefined') {
        revenueData.month2.prevRevenue = line[`${riskCategory}PrevWeek`].M2_Rev;
        revenueData.month2.prevCost = line[`${riskCategory}PrevWeek`].M2_Cost;
        revenueData.month2.prevCGPAmount = line[`${riskCategory}PrevWeek`].M2_cGP$;
        revenueData.month2.prevCGPProcents = line[`${riskCategory}PrevWeek`]['M2_cGP%'];
      }
      setDefaultCGPProcents(revenueData.month2);
      revenueData.month3 = {
        revenue: line[`${riskCategory}CurrentWeek`].M3_Rev,
        cost: line[`${riskCategory}CurrentWeek`].M3_Cost,
        cGPAmount: line[`${riskCategory}CurrentWeek`].M3_cGP$,
        cGPProcents: line[`${riskCategory}CurrentWeek`]['M3_cGP%'],
      };
      if (typeof line[`${riskCategory}PrevWeek`] !== 'undefined') {
        revenueData.month3.prevRevenue = line[`${riskCategory}PrevWeek`].M3_Rev;
        revenueData.month3.prevCost = line[`${riskCategory}PrevWeek`].M3_Cost;
        revenueData.month3.prevCGPAmount = line[`${riskCategory}PrevWeek`].M3_cGP$;
        revenueData.month3.prevCGPProcents = line[`${riskCategory}PrevWeek`]['M3_cGP%'];
      }
      setDefaultCGPProcents(revenueData.month3);
      revenueData.quarter = {
        revenue: line[`${riskCategory}CurrentWeek`].QTR_Rev,
        cost: line[`${riskCategory}CurrentWeek`].QTR_Cost,
        cGPAmount: line[`${riskCategory}CurrentWeek`].QTR_cGP_$,
        cGPProcents: line[`${riskCategory}CurrentWeek`]['QTR_cGP_%'],
      };
      if (typeof line[`${riskCategory}PrevWeek`] !== 'undefined') {
        revenueData.quarter.prevRevenue = line[`${riskCategory}PrevWeek`].QTR_Rev;
        revenueData.quarter.prevCost = line[`${riskCategory}PrevWeek`].QTR_Cost;
        revenueData.quarter.prevCGPAmount = line[`${riskCategory}PrevWeek`].QTR_cGP_$;
        revenueData.quarter.prevCGPProcents = line[`${riskCategory}PrevWeek`]['QTR_cGP_%'];
      }
      setDefaultCGPProcents(revenueData.quarter);
      revenueData.prevQtrPerformance = {
        revenue: line[`${riskCategory}CurrentWeek`]['Rev_Roll-over'],
        cost: line[`${riskCategory}CurrentWeek`]['Cost_Roll-over'],
        cGPProcents: line[`${riskCategory}CurrentWeek`]['cGP%_Roll-over'],
        cGPAmount: { value: 0 },

      };
      if (revenueData.prevQtrPerformance.revenue && revenueData.prevQtrPerformance.cost) {
        revenueData.prevQtrPerformance.cGPAmount.value = Number(revenueData.prevQtrPerformance.revenue.value) - Number(revenueData.prevQtrPerformance.cost.value);
        if (typeof revenueData.prevQtrPerformance.cGPProcents === 'undefined') {
          revenueData.prevQtrPerformance.cGPProcents = {};
        }
        revenueData.prevQtrPerformance.cGPProcents.value = utilsService.calculateCGPProcents(revenueData.prevQtrPerformance.revenue.value, revenueData.prevQtrPerformance.cGPAmount.value);
      }
    }
    if (riskCategoryName) {
      line[riskCategoryName] = revenueData;
    } else {
      line = revenueData;
    }
  }

  function getMapKey(line) {
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG == true) {
      return `${line.account.Name}_${line.approval.Name}_${line.serviceLine.Name}`;
    }
    return `${line.account.Name}_${line.serviceLine.Name}`;
  }

  function mergeVersusData(commitData, riskCategory) {
    const rdmpSourceSystemData = calculateRdmpVSSourceDataOrIppf(commitData, commitData.bestCanDoCurrentWeek);
    let pcwRev = 0.00;
    let signYieldPCW = 0.00;
    let pcwPerformed = 0.00;
    if (angular.isDefined(commitData.bestCanDoCurrentWeek)
      && angular.isDefined(commitData.bestCanDoCurrentWeek.PCW_Identified)) {
      pcwRev = commitData.bestCanDoCurrentWeek.PCW_Identified.value;
    }

    if (typeof pcwRev === 'undefined') {
      pcwRev = 0.00;
    }

    if (angular.isDefined(commitData.bestCanDoCurrentWeek)
      && angular.isDefined(commitData.bestCanDoCurrentWeek.PCW_Performed)) {
      pcwPerformed = commitData.bestCanDoCurrentWeek.PCW_Performed.value;
    }
    if (typeof pcwPerformed === 'undefined') {
      pcwPerformed = 0.00;
    }

    let revenueValue = 0.00;
    if (angular.isDefined(commitData.bestCanDoCurrentWeek)
      && angular.isDefined(commitData.bestCanDoCurrentWeek.QTR_Rev)) {
      revenueValue = commitData.bestCanDoCurrentWeek.QTR_Rev.value;
    }
    if (pcwRev > 0) {
      signYieldPCW = pcwRev - revenueValue;
    }
    commitData.rdmpSourceSystemData = rdmpSourceSystemData;
    commitData.pcwRev = pcwRev;
    commitData.signYieldPCW = signYieldPCW;
    commitData.pcwPerformed = pcwPerformed;
  }

  function mergeDataSource(dataSource, commitData) {
    let a = 0;
    if (typeof dataSource === 'undefined') {
      return;
    }
    if (dataSource.length === 0) {
      return;
    }

    let source = dataSource;
    if (angular.isUndefined(source)) {
      source = [];
    }
    const sourceHashMap = {};
    source.forEach((line) => {
      const hashCode = getMapKey(line);
      sourceHashMap[hashCode] = {
        code: hashCode,
        line,
      };
    });
    source = [];
    let len = 0;
    if (commitData) {
      len = commitData.length;
    }
    while (a < len) {
      if (!commitData[a].sourceData) {
        commitData[a].sourceData = {};
      }
      const hashCode = getMapKey(commitData[a]);
      const sourceData = sourceHashMap[hashCode];
      if (angular.isDefined(sourceData) && angular.isDefined(sourceData.line)) {
        Object.keys(sourceData.line.sourceData).forEach((key) => {
          commitData[a].sourceData[key] = sourceData.line.sourceData[key];
        });
      }
      sourceHashMap[hashCode] = {};
      mergeVersusData(commitData[a]);
      a += 1;
    }
    dataSource = [];
  }

  function calculateQTRRdmpVSData(rdmpData, sourceData, propertyName) {
    const roadmapVSData = {
      revenue: { value: 0 },
      cost: { value: 0 },
      cGPAmount: { value: 0 },
      cGPProcents: { value: 0 },
    };
    if (angular.isDefined(rdmpData)) {
      if (sourceData[`${propertyName}_Rev`] && rdmpData.revenue) {
        roadmapVSData.revenue.value = Number(sourceData[`${propertyName}_Rev`].value) - Number(rdmpData.revenue.value);
      }
      if (sourceData[`${propertyName}_Cost`] && rdmpData.cost) {
        roadmapVSData.cost.value = Number(sourceData[`${propertyName}_Cost`].value) - Number(rdmpData.cost.value);
      }
      if (sourceData[`${propertyName}_cGP_$`] && rdmpData.cGPAmount) {
        roadmapVSData.cGPAmount.value = Number(sourceData[`${propertyName}_cGP_$`].value) - Number(rdmpData.cGPAmount.value);
      }
      if (sourceData[`${propertyName}_cGP_%`] && rdmpData.cGPProcents) {
        roadmapVSData.cGPProcents.value = Number(sourceData[`${propertyName}_cGP_%`].value) - Number(rdmpData.cGPProcents.value);
      }
    }
    return roadmapVSData;
  }

  function calculateRdmpVsSource(rdmpData, sourceData) {
    const rdmpSourceSystemData = {
      revenue: { value: 0 },
      cost: { value: 0 },
      cGPAmount: { value: 0 },
      cGPProcents: { value: 0 },
    };
    if (utilsService.isDefined(sourceData.QTR_Rev)
      && utilsService.isDefined(rdmpData.QTR_Rev)) {
      rdmpSourceSystemData.revenue.value = sourceData.QTR_Rev.value
        - rdmpData.QTR_Rev.value;
    }

    if (utilsService.isDefined(sourceData.QTR_Rev)
      && utilsService.isDefined(rdmpData.quarter)
      && utilsService.isDefined(rdmpData.quarter.revenue)) {
      rdmpSourceSystemData.revenue.value = sourceData.QTR_Rev.value
        - rdmpData.quarter.revenue.value;
    }

    if (utilsService.isDefined(sourceData.QTR_Cost)
      && utilsService.isDefined(rdmpData.QTR_Cost)) {
      rdmpSourceSystemData.cost.value = sourceData.QTR_Cost.value
        - rdmpData.QTR_Cost.value;
    }

    if (utilsService.isDefined(sourceData.QTR_Cost)
      && utilsService.isDefined(rdmpData.quarter)
      && utilsService.isDefined(rdmpData.quarter.cost)) {
      rdmpSourceSystemData.cost.value = sourceData.QTR_Cost.value
        - rdmpData.quarter.cost.value;
    }

    if (utilsService.isDefined(sourceData.QTR_cGP_$)
      && utilsService.isDefined(rdmpData.QTR_cGP_$)) {
      rdmpSourceSystemData.cGPAmount.value = sourceData.QTR_cGP_$.value
        - rdmpData.QTR_cGP_$.value;
    }

    if (utilsService.isDefined(sourceData.QTR_cGP_$)
      && utilsService.isDefined(rdmpData.quarter)
      && utilsService.isDefined(rdmpData.quarter.cGPAmount)) {
      rdmpSourceSystemData.cGPAmount.value = sourceData.QTR_cGP_$.value
        - rdmpData.quarter.cGPAmount.value;
    }

    rdmpSourceSystemData.cGPProcents.value = utilsService.calculateCGPProcents(
      rdmpSourceSystemData.revenue.value,
      rdmpSourceSystemData.cGPAmount.value);
    return rdmpSourceSystemData;
  }

  function calculateRdmpVSSourceDataOrIppf(data, bestCanDoCurrentWeek) {
    let rdmpSourceSystemData = null;
    if (data.sourceData && data.load && typeof data.load['Contract End Date_load'] !== 'undefined' &&
      data.load['Contract End Date_load'] !== 0) {
      if (utilsService.isDefined(data.sourceData) && utilsService.isDefined(data.sourceData.ippfBestCanDoCurrentWeek)
        && utilsService.isDefined(bestCanDoCurrentWeek)) {
        rdmpSourceSystemData = calculateRdmpVsSource(bestCanDoCurrentWeek, data.sourceData.ippfBestCanDoCurrentWeek);
      }
    } else if (utilsService.isDefined(data.sourceData) && utilsService.isDefined(data.sourceData.scBestCanDoCurrentWeek)
      && utilsService.isDefined(bestCanDoCurrentWeek)) {
      rdmpSourceSystemData = calculateRdmpVsSource(bestCanDoCurrentWeek, data.sourceData.scBestCanDoCurrentWeek);
    }
    return rdmpSourceSystemData;
  }

  function mergeSourceDataForPopup(data) {
    data.sourceData.bestCanDo = {
      scRoadmapVSData: {
        month1: {},
        month2: {},
        month3: {},
        quarter: {},
      },
    };
    data.sourceData.commit = {
      scRoadmapVSData: {
        month1: {},
        month2: {},
        month3: {},
        quarter: {},
      },
    };
    if (data.sourceData.scBestCanDoCurrentWeek && data.bestCanDoTabData) {
      data.sourceData.bestCanDo.scRoadmapVSData.month1 = calculateQTRRdmpVSData(data.bestCanDoTabData.bestCanDo.month1, data.sourceData.scBestCanDoCurrentWeek, 'M1');
      data.sourceData.bestCanDo.scRoadmapVSData.month2 = calculateQTRRdmpVSData(data.bestCanDoTabData.bestCanDo.month2, data.sourceData.scBestCanDoCurrentWeek, 'M2');
      data.sourceData.bestCanDo.scRoadmapVSData.month3 = calculateQTRRdmpVSData(data.bestCanDoTabData.bestCanDo.month3, data.sourceData.scBestCanDoCurrentWeek, 'M3');
      data.sourceData.bestCanDo.scRoadmapVSData.quarter = calculateQTRRdmpVSData(data.bestCanDoTabData.bestCanDo.quarter, data.sourceData.scBestCanDoCurrentWeek, 'QTR');
    }
    if (data.sourceData.scCommitCurrentWeek) {
      data.sourceData.commit.scRoadmapVSData.month1 = calculateQTRRdmpVSData(data.commitTabData.commit.month1, data.sourceData.scCommitCurrentWeek, 'M1');
      data.sourceData.commit.scRoadmapVSData.month2 = calculateQTRRdmpVSData(data.commitTabData.commit.month2, data.sourceData.scCommitCurrentWeek, 'M2');
      data.sourceData.commit.scRoadmapVSData.month3 = calculateQTRRdmpVSData(data.commitTabData.commit.month3, data.sourceData.scCommitCurrentWeek, 'M3');
      data.sourceData.commit.scRoadmapVSData.quarter = calculateQTRRdmpVSData(data.commitTabData.commit.quarter, data.sourceData.scCommitCurrentWeek, 'QTR');
    }
    data.rdmpSourceSystemData = calculateRdmpVSSourceDataOrIppf(data, data.bestCanDoTabData.bestCanDo);
  }

  const getTotalsDefaults = () => ({
    month1: {},
    month2: {},
    month3: {},
    quarter: {},
    action: {},
    previousWeek: {
      month1: {},
      month2: {},
      month3: {},
      quarter: {},
    },
  });

  const getBacklogOrSigningsDefaults = () => ({
    month1: {
      previousWeek: {},
    },
    month2: {
      previousWeek: {},
    },
    month3: {
      previousWeek: {},
    },
    quarter: {
      previousWeek: {},
    },
    action: {},
  });

  const getDefaultAdjustmentValues = () => ({
    accountExpected: getBacklogOrSigningsDefaults(),
    accountRoadmap: getBacklogOrSigningsDefaults(),
    ofWhichRisk: getBacklogOrSigningsDefaults(),
    adjustmentApplied: getBacklogOrSigningsDefaults(),
  });

  const setAdjustmentData = (adjustmentData, backlogData, columnSuffix, colNames, isCopyRiskCategory) => {
    adjustmentData.revenue = getAttributes(backlogData, colNames[`revenue_${columnSuffix}`]);
    if (angular.isDefined(adjustmentData.revenue)) {
      adjustmentData.revenue.value = utilsService.formatNumber(adjustmentData.revenue.value);
    }
    adjustmentData.cost = getAttributes(backlogData, colNames[`cost_${columnSuffix}`]);
    if (angular.isDefined(adjustmentData.cost)) {
      adjustmentData.cost.value = utilsService.formatNumber(adjustmentData.cost.value);
    }
    if (isCopyRiskCategory) {
      adjustmentData.revenue.row = backlogData.riskCategory;
      adjustmentData.cost.row = backlogData.riskCategory;
    }
    adjustmentData.cGPAmount = getAttributes(backlogData, colNames[`cGPAmount_${columnSuffix}`]);
    adjustmentData.cGPProcents = getAttributesProcents(backlogData, colNames[`cGPProcents_${columnSuffix}`]);
  };

  const setAccountExpected = (accountExpected, backlogCommitAccountExpected, colNames, signYieldExpected) => {
    if (backlogCommitAccountExpected) {
      if (angular.isDefined(signYieldExpected)) {
        accountExpected.action = {
          comment: getAttributes(signYieldExpected[0], columnNames.actionComment),
          owner: getAttributes(signYieldExpected[0], columnNames.actionOwner),
          taskid: getAttributes(signYieldExpected[0],columnNames.actionTask),
          dueDate: getAttributes(signYieldExpected[0], columnNames.actionDueDate),
          RAG: getAttributes(signYieldExpected[0], columnNames.rag_load),
          richComment: getAttributes(signYieldExpected[0], columnNames.actionRichComment),
          review: getAttributes(signYieldExpected[0], columnNames.review),
        };
      } else {
        accountExpected.action = {
          comment: getAttributes(backlogCommitAccountExpected, columnNames.actionComment),
          owner: getAttributes(backlogCommitAccountExpected, columnNames.actionOwner),
          taskid: getAttributes(backlogCommitAccountExpected,columnNames.actionTask),
          dueDate: getAttributes(backlogCommitAccountExpected, columnNames.actionDueDate),
          RAG: getAttributes(backlogCommitAccountExpected, columnNames.rag_load),
          richComment: getAttributes(backlogCommitAccountExpected, columnNames.actionRichComment),
          review: getAttributes(backlogCommitAccountExpected, columnNames.review),
        };
      }
      accountExpected.action.comment.row = backlogCommitAccountExpected.riskCategory;
      accountExpected.action.owner.row = backlogCommitAccountExpected.riskCategory;
      accountExpected.action.taskid.row = backlogCommitAccountExpected.riskCategory;
      accountExpected.action.dueDate.row = backlogCommitAccountExpected.riskCategory;
      accountExpected.action.RAG.row = backlogCommitAccountExpected.riskCategory;
      accountExpected.action.richComment.row = backlogCommitAccountExpected.riskCategory;
      accountExpected.action.review.row = backlogCommitAccountExpected.riskCategory;

      accountExpected.account = backlogCommitAccountExpected.account;

      setAdjustmentData(accountExpected.quarter, backlogCommitAccountExpected, 'Qtr', colNames, true);
      setAdjustmentData(accountExpected.month1, backlogCommitAccountExpected, 'M1', colNames, true);
      setAdjustmentData(accountExpected.month2, backlogCommitAccountExpected, 'M2', colNames, true);
      setAdjustmentData(accountExpected.month3, backlogCommitAccountExpected, 'M3', colNames, true);
    }
  };

  const setAdjustmentApplied = (accountApplied, backlogCommitBacklogAdjustmentAplied, colNames) => {
    setAdjustmentData(accountApplied.quarter, backlogCommitBacklogAdjustmentAplied, 'Qtr', colNames, false);
    setAdjustmentData(accountApplied.month1, backlogCommitBacklogAdjustmentAplied, 'M1', colNames, false);
    setAdjustmentData(accountApplied.month2, backlogCommitBacklogAdjustmentAplied, 'M2', colNames, false);
    setAdjustmentData(accountApplied.month3, backlogCommitBacklogAdjustmentAplied, 'M3', colNames, false);
  };

  const setSignedData = (accountRoadmapData, signingsCommmitSignYieldRoadmap, colNames, columnSuffix) => {
    accountRoadmapData.revenue = getAttributes(signingsCommmitSignYieldRoadmap, colNames[`revenueTBSigned_${columnSuffix}`]);
    accountRoadmapData.revenueSigned = getAttributes(signingsCommmitSignYieldRoadmap, colNames[`revenueSigned_${columnSuffix}`]);
    accountRoadmapData.cost = getAttributes(signingsCommmitSignYieldRoadmap, colNames[`costTBSigned_${columnSuffix}`]);
    accountRoadmapData.costSigned = getAttributes(signingsCommmitSignYieldRoadmap, colNames[`costSigned_${columnSuffix}`]);
    accountRoadmapData.cGPAmount = getAttributes(signingsCommmitSignYieldRoadmap, colNames[`cGPAmountTBSigned_${columnSuffix}`]);
    accountRoadmapData.cGPAmountSigned = getAttributes(signingsCommmitSignYieldRoadmap, colNames[`cGPAmountSigned_${columnSuffix}`]);
    accountRoadmapData = calculateAccountRoadmap(accountRoadmapData);
    accountRoadmapData.cGPProcents = {};
    accountRoadmapData.cGPProcents.value = utilsService.calculateCGPProcents(accountRoadmapData.revenue.value, accountRoadmapData.cGPAmount.value);
  };

  const setRoadmapData = (accountRoadmap, signingsCommmitSignYieldRoadmap, colNames) => {
    if (signingsCommmitSignYieldRoadmap) {
      setSignedData(accountRoadmap.month1, signingsCommmitSignYieldRoadmap, colNames, 'M1');
      setSignedData(accountRoadmap.month2, signingsCommmitSignYieldRoadmap, colNames, 'M2');
      setSignedData(accountRoadmap.month3, signingsCommmitSignYieldRoadmap, colNames, 'M3');

      accountRoadmap.quarter.revenue = {};
      accountRoadmap.quarter.cost = {};
      accountRoadmap.quarter.cGPAmount = {};
      accountRoadmap.quarter.revenue.value = Number(accountRoadmap.month3.revenue.value) +
        Number(accountRoadmap.month2.revenue.value) + Number(accountRoadmap.month1.revenue.value);
      accountRoadmap.quarter.cost.value = Number(accountRoadmap.month3.cost.value) +
        Number(accountRoadmap.month2.cost.value) + Number(accountRoadmap.month1.cost.value);
      accountRoadmap.quarter.cGPAmount.value = Number(accountRoadmap.month3.cGPAmount.value) +
        Number(accountRoadmap.month2.cGPAmount.value) + Number(accountRoadmap.month1.cGPAmount.value);
      accountRoadmap.quarter.cGPProcents = {};
      accountRoadmap.quarter.cGPProcents.value = utilsService.calculateCGPProcents(accountRoadmap.quarter.revenue.value, accountRoadmap.quarter.cGPAmount.value);
    }
  };

  const setBacklogAccountRoadmap = (accountRoadmap, backlogCommmitSignYieldRoadmap, colNames) => {
    const setBacklogValues = (accountRoadmapData, backlogSignYieldRoadmap,
      cNames, columnSuffix) => {

      accountRoadmapData.revenue = getAttributes(backlogSignYieldRoadmap, cNames[`revenue${backlogSuffix}_${columnSuffix}`]);
      accountRoadmapData.cost = getAttributes(backlogSignYieldRoadmap, cNames[`cost${backlogSuffix}_${columnSuffix}`]);
      accountRoadmapData.cGPAmount = getAttributes(backlogSignYieldRoadmap, cNames[`cGPAmount${backlogSuffix}_${columnSuffix}`]);
      accountRoadmapData.cGPProcents = getAttributesProcents(backlogSignYieldRoadmap, cNames[`cGPProcents${backlogSuffix}_${columnSuffix}`]);
      accountRoadmapData.cGPProcents.value =
        utilsService.calculateCGPProcents(accountRoadmapData.revenue.value,
          accountRoadmapData.cGPAmount.value);
    };
    if (backlogCommmitSignYieldRoadmap) {
      setBacklogValues(accountRoadmap.month1, backlogCommmitSignYieldRoadmap, colNames, 'M1');
      setBacklogValues(accountRoadmap.month2, backlogCommmitSignYieldRoadmap, colNames, 'M2');
      setBacklogValues(accountRoadmap.month3, backlogCommmitSignYieldRoadmap, colNames, 'M3');

      accountRoadmap.quarter.revenue = getAttributes(backlogCommmitSignYieldRoadmap, colNames[`revenue${backlogSuffix}_Qtr`]);
      accountRoadmap.quarter.cost = getAttributes(backlogCommmitSignYieldRoadmap, colNames[`cost${backlogSuffix}_Qtr`]);
      accountRoadmap.quarter.cGPAmount = getAttributes(backlogCommmitSignYieldRoadmap, colNames[`cGPAmount${backlogSuffix}_Qtr`]);
      accountRoadmap.quarter.cGPProcents = getAttributesProcents(backlogCommmitSignYieldRoadmap, colNames[`cGPProcents${backlogSuffix}_Qtr`]);
    }
  };

  const setBacklogCommitOWRisk = (ofWhichRisk, backlogCommitOWRisk, colNames) => {
    const setOfWhichRiskValues = (ofWhichRiskData, backlogOWRisk, cNames, columnSuffix) => {
      ofWhichRiskData.revenue = getAttributes(backlogOWRisk, cNames[`revenue${backlogSuffix}_${columnSuffix}`]);
      ofWhichRiskData.cost = getAttributes(backlogOWRisk, cNames[`cost${backlogSuffix}_${columnSuffix}`]);
      ofWhichRiskData.cGPAmount = getAttributes(backlogOWRisk, cNames[`cGPAmount${backlogSuffix}_${columnSuffix}`]);
      ofWhichRiskData.cGPProcents = getAttributesProcents(backlogOWRisk, cNames[`cGPProcents${backlogSuffix}_${columnSuffix}`]);
      ofWhichRiskData.cGPProcents.value = utilsService.calculateCGPProcents(ofWhichRiskData.revenue.value, ofWhichRiskData.cGPAmount.value);
    };
    if (backlogCommitOWRisk) {
      ofWhichRisk.quarter.revenue = getAttributes(backlogCommitOWRisk[0], columnNames[`revenue${backlogSuffix}_Qtr`]);
      ofWhichRisk.quarter.cost = getAttributes(backlogCommitOWRisk[0], columnNames[`cost${backlogSuffix}_Qtr`]);
      ofWhichRisk.quarter.cGPAmount = getAttributes(backlogCommitOWRisk[0], columnNames[`cGPAmount${backlogSuffix}_Qtr`]);
      ofWhichRisk.quarter.cGPProcents = getAttributes(backlogCommitOWRisk[0], columnNames[`cGPProcents${backlogSuffix}_Qtr`]);

      setOfWhichRiskValues(ofWhichRisk.month1, backlogCommitOWRisk[0], colNames, 'M1');
      setOfWhichRiskValues(ofWhichRisk.month2, backlogCommitOWRisk[0], colNames, 'M2');
      setOfWhichRiskValues(ofWhichRisk.month3, backlogCommitOWRisk[0], colNames, 'M3');
    }
  };

  // This function merges account adjustment data from Cognos format to UI friendly format.
  function mergeAccountAdjustments(data, riskCategoryType) {
    let objectType = 'commit';
    if (riskCategoryType === 'Best Can Do') {
      objectType = 'bestCanDo';
    }
    if (riskCategoryType === 'Stretch') {
      objectType = 'stretch';
    }

    const accountAdjustment = {};
    accountAdjustment[objectType] = {
      backlog: {},
      signings: {},
      totals: {},
    };
    accountAdjustment[objectType].backlog = getDefaultAdjustmentValues();
    accountAdjustment[objectType].signings = getDefaultAdjustmentValues();
    accountAdjustment[objectType].totals = {
      accountExpected: getTotalsDefaults(),
      accountRoadmap: getTotalsDefaults(),
      ofWhichRisk: getTotalsDefaults(),
      adjustmentApplied: getTotalsDefaults(),
    };
    const element = data;

    // Backlog info
    setAccountExpected(accountAdjustment[objectType].backlog.accountExpected, element.backlogCommitAccountExpected[0], columnNames);

    // Account Roadmap info
    setBacklogAccountRoadmap(accountAdjustment[objectType].backlog.accountRoadmap, element.backlogCommmitSignYieldRoadmap[0], columnNames);

    // Of which risk
    setBacklogCommitOWRisk(accountAdjustment[objectType].backlog.ofWhichRisk, element.backlogCommitOWRisk, columnNames);

    // Backlog Adjustment applied
    setAdjustmentApplied(accountAdjustment[objectType].backlog.adjustmentApplied, element.backlogCommitBacklogAdjustmentAplied[0], columnNames);

    // SIGNINGS
    setAccountExpected(accountAdjustment[objectType].signings.accountExpected, element.signingsCommitAccountExpected[0], columnNames, element.signYieldExpected);


    // Account Roadmap info
    setRoadmapData(accountAdjustment[objectType].signings.accountRoadmap, element.signingsCommmitSignYieldRoadmap[0], columnNames);

    // Of which risk
    if (element.signingsCommitOWRisk) {
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cost = getAttributes(element.signingsCommitOWRisk[0], columnNames.costBacklog_Qtr);
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cGPAmount = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountBacklog_Qtr);
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cGPProcents = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPProcentsBacklog_Qtr);

      accountAdjustment[objectType].signings.ofWhichRisk.month1.revenue = getAttributes(element.signingsCommitOWRisk[0], columnNames.revenueTBSigned_M1);
      accountAdjustment[objectType].signings.ofWhichRisk.month1.revenueSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.revenueSigned_M1);
      accountAdjustment[objectType].signings.ofWhichRisk.month1.cost = getAttributes(element.signingsCommitOWRisk[0], columnNames.costTBSigned_M1);
      accountAdjustment[objectType].signings.ofWhichRisk.month1.costSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.costSigned_M1);
      accountAdjustment[objectType].signings.ofWhichRisk.month1.cGPAmount = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountSigned_M1);
      accountAdjustment[objectType].signings.ofWhichRisk.month1.cGPAmountSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountTBSigned_M1);
      accountAdjustment[objectType].signings.ofWhichRisk.month1 = calculateOWRisks(accountAdjustment[objectType].signings.ofWhichRisk.month1);

      accountAdjustment[objectType].signings.ofWhichRisk.month1.cGPProcents = {};
      accountAdjustment[objectType].signings.ofWhichRisk.month1.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].signings.ofWhichRisk.month1.revenue.value, accountAdjustment[objectType].signings.ofWhichRisk.month1.cGPAmount.value);

      accountAdjustment[objectType].signings.ofWhichRisk.month2.revenue = getAttributes(element.signingsCommitOWRisk[0], columnNames.revenueTBSigned_M2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2.revenueSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.revenueSigned_M2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2.cost = getAttributes(element.signingsCommitOWRisk[0], columnNames.costTBSigned_M2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2.costSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.costSigned_M2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2.cGPAmount = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountSigned_M2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2.cGPAmountSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountTBSigned_M2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2 = calculateOWRisks(accountAdjustment[objectType].signings.ofWhichRisk.month2);
      accountAdjustment[objectType].signings.ofWhichRisk.month2.cGPProcents = {};
      accountAdjustment[objectType].signings.ofWhichRisk.month2.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].signings.ofWhichRisk.month2.revenue.value, accountAdjustment[objectType].signings.ofWhichRisk.month2.cGPAmount.value);

      accountAdjustment[objectType].signings.ofWhichRisk.month3.revenue = getAttributes(element.signingsCommitOWRisk[0], columnNames.revenueTBSigned_M3);
      accountAdjustment[objectType].signings.ofWhichRisk.month3.revenueSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.revenueSigned_M3);
      accountAdjustment[objectType].signings.ofWhichRisk.month3.cost = getAttributes(element.signingsCommitOWRisk[0], columnNames.costTBSigned_M3);
      accountAdjustment[objectType].signings.ofWhichRisk.month3.costSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.costSigned_M3);
      accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPAmount = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountSigned_M3);
      accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPAmountSigned = getAttributes(element.signingsCommitOWRisk[0], columnNames.cGPAmountTBSigned_M3);

      accountAdjustment[objectType].signings.ofWhichRisk.month3 = calculateOWRisks(accountAdjustment[objectType].signings.ofWhichRisk.month3);
      accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPProcents = {};
      accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].signings.ofWhichRisk.month3.revenue.value, accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPAmount.value);
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.revenue = {};
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cost = {};
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.revenue.value = Number(accountAdjustment[objectType].signings.ofWhichRisk.month3.revenue.value) +
        Number(accountAdjustment[objectType].signings.ofWhichRisk.month3.revenue.value) + Number(accountAdjustment[objectType].signings.ofWhichRisk.month1.revenue.value);
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cost.value = Number(accountAdjustment[objectType].signings.ofWhichRisk.month3.cost.value) +
        Number(accountAdjustment[objectType].signings.ofWhichRisk.month3.cost.value) + Number(accountAdjustment[objectType].signings.ofWhichRisk.month1.cost.value);
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cGPAmount.value = Number(accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPAmount.value) +
        Number(accountAdjustment[objectType].signings.ofWhichRisk.month3.cGPAmount.value) + Number(accountAdjustment[objectType].signings.ofWhichRisk.month1.cGPAmount.value);
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cGPProcents = {};
      accountAdjustment[objectType].signings.ofWhichRisk.quarter.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].signings.ofWhichRisk.quarter.revenue.value, accountAdjustment[objectType].signings.ofWhichRisk.quarter.cGPAmount.value);
    }


    // Adjustment applied
    setAdjustmentApplied(accountAdjustment[objectType].signings.adjustmentApplied, element.signingsCommitBacklogAdjustmentAplied[0], columnNames);

    // TOTALS

    // Account expected4
    accountAdjustment[objectType].totals.accountExpected.month1.revenue = {};
    accountAdjustment[objectType].totals.accountExpected.month1.cost = {};
    accountAdjustment[objectType].totals.accountExpected.month1.cGPAmount = {};
    accountAdjustment[objectType].totals.accountExpected.month1.cGPProcents = {};

    accountAdjustment[objectType].totals.accountExpected.month2.revenue = {};
    accountAdjustment[objectType].totals.accountExpected.month2.cost = {};
    accountAdjustment[objectType].totals.accountExpected.month2.cGPAmount = {};
    accountAdjustment[objectType].totals.accountExpected.month2.cGPProcents = {};

    accountAdjustment[objectType].totals.accountExpected.month3.revenue = {};
    accountAdjustment[objectType].totals.accountExpected.month3.cost = {};
    accountAdjustment[objectType].totals.accountExpected.month3.cGPAmount = {};
    accountAdjustment[objectType].totals.accountExpected.month3.cGPProcents = {};

    accountAdjustment[objectType].totals.accountExpected.quarter.revenue = {};
    accountAdjustment[objectType].totals.accountExpected.quarter.cost = {};
    accountAdjustment[objectType].totals.accountExpected.quarter.cGPAmount = {};
    accountAdjustment[objectType].totals.accountExpected.quarter.cGPProcents = {};

    function calculateAdjustmentTotals(totals, backlogRoadmap, backlogApplied, signingsRoadmap, signingsApplied) {
      totals.revenue.value = Number(backlogRoadmap.revenue.value) + Number(backlogApplied.revenue.value) + Number(signingsRoadmap.revenue.value) + Number(signingsApplied.revenue.value);
      if (backlogRoadmap.revenue.sandbox || backlogApplied.revenue.sandbox || signingsRoadmap.revenue.sandbox || signingsApplied.revenue.sandbox) {
        totals.revenue.sandbox = true;
        totals.cGPAmount.sandbox = true;
        totals.cGPProcents.sandbox = true;
      }

      totals.cost.value = Number(backlogRoadmap.cost.value) + Number(backlogApplied.cost.value) + Number(signingsRoadmap.cost.value) + Number(signingsApplied.cost.value);
      if (backlogRoadmap.cost.sandbox || backlogApplied.cost.sandbox || signingsRoadmap.cost.sandbox || signingsApplied.cost.sandbox) {
        totals.cost.sandbox = true;
        totals.cGPAmount.sandbox = true;
        totals.cGPProcents.sandbox = true;
      }

      totals.cGPAmount.value = Number(totals.revenue.value) - Number(totals.cost.value);

      totals.cGPProcents.value = utilsService.calculateCGPProcents(totals.revenue.value, totals.cGPAmount.value);
    }

    calculateAdjustmentTotals(accountAdjustment[objectType].totals.accountExpected.month1,
      accountAdjustment[objectType].backlog.accountRoadmap.month1,
      accountAdjustment[objectType].backlog.adjustmentApplied.month1,
      accountAdjustment[objectType].signings.accountRoadmap.month1,
      accountAdjustment[objectType].signings.adjustmentApplied.month1);

    calculateAdjustmentTotals(accountAdjustment[objectType].totals.accountExpected.month2,
      accountAdjustment[objectType].backlog.accountRoadmap.month2,
      accountAdjustment[objectType].backlog.adjustmentApplied.month2,
      accountAdjustment[objectType].signings.accountRoadmap.month2,
      accountAdjustment[objectType].signings.adjustmentApplied.month2);

    calculateAdjustmentTotals(accountAdjustment[objectType].totals.accountExpected.month3,
      accountAdjustment[objectType].backlog.accountRoadmap.month3,
      accountAdjustment[objectType].backlog.adjustmentApplied.month3,
      accountAdjustment[objectType].signings.accountRoadmap.month3,
      accountAdjustment[objectType].signings.adjustmentApplied.month3);

    accountAdjustment[objectType].totals.accountExpected.quarter.revenue.value = Number(accountAdjustment[objectType].totals.accountExpected.month1.revenue.value) +
      Number(accountAdjustment[objectType].totals.accountExpected.month2.revenue.value) +
      Number(accountAdjustment[objectType].totals.accountExpected.month3.revenue.value);
    accountAdjustment[objectType].totals.accountExpected.quarter.cost.value = Number(accountAdjustment[objectType].totals.accountExpected.month1.cost.value) +
      Number(accountAdjustment[objectType].totals.accountExpected.month2.cost.value) +
      Number(accountAdjustment[objectType].totals.accountExpected.month3.cost.value);

    accountAdjustment[objectType].totals.accountExpected.quarter.cGPAmount.value = Number(accountAdjustment[objectType].totals.accountExpected.quarter.revenue.value) -
      Number(accountAdjustment[objectType].totals.accountExpected.quarter.cost.value);

    if (accountAdjustment[objectType].totals.accountExpected.month1.revenue.sandbox || accountAdjustment[objectType].totals.accountExpected.month2.revenue.sandbox ||
      accountAdjustment[objectType].totals.accountExpected.month3.revenue.sandbox || accountAdjustment[objectType].totals.accountExpected.quarter.revenue.sandbox) {
      accountAdjustment[objectType].totals.accountExpected.quarter.revenue.sandbox = true;
      accountAdjustment[objectType].totals.accountExpected.quarter.cGPAmount.sandbox = true;
      accountAdjustment[objectType].totals.accountExpected.quarter.cGPProcents.sandbox = true;
    }
    if (accountAdjustment[objectType].totals.accountExpected.month1.cost.sandbox || accountAdjustment[objectType].totals.accountExpected.month2.cost.sandbox ||
      accountAdjustment[objectType].totals.accountExpected.month3.cost.sandbox || accountAdjustment[objectType].totals.accountExpected.quarter.cost.sandbox) {
      accountAdjustment[objectType].totals.accountExpected.quarter.cost.sandbox = true;
      accountAdjustment[objectType].totals.accountExpected.quarter.cGPAmount.sandbox = true;
      accountAdjustment[objectType].totals.accountExpected.quarter.cGPProcents.sandbox = true;
    }

    accountAdjustment[objectType].totals.accountExpected.quarter.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.accountExpected.quarter.revenue.value, accountAdjustment[objectType].totals.accountExpected.quarter.cGPAmount.value);

    // Account Roadmap

    accountAdjustment[objectType].totals.accountRoadmap.month1.revenue = getAttributes(element.commitAccountExpected[0], columnNames.revenue_M1);
    accountAdjustment[objectType].totals.accountRoadmap.month1.cost = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cost_M1);
    accountAdjustment[objectType].totals.accountRoadmap.month1.cGPAmount = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPAmount_M1);
    accountAdjustment[objectType].totals.accountRoadmap.month1.cGPProcents = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPProcents_M1);

    accountAdjustment[objectType].totals.accountRoadmap.month2.revenue = getAttributes(element.commitAccountExpected[0], columnNames.revenue_M2);
    accountAdjustment[objectType].totals.accountRoadmap.month2.cost = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cost_M2);
    accountAdjustment[objectType].totals.accountRoadmap.month2.cGPAmount = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPAmount_M2);
    accountAdjustment[objectType].totals.accountRoadmap.month2.cGPProcents = getAttributesProcents(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPProcents_M2);

    accountAdjustment[objectType].totals.accountRoadmap.month3.revenue = getAttributes(element.commitAccountExpected[0], columnNames.revenue_M3);
    accountAdjustment[objectType].totals.accountRoadmap.month3.cost = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cost_M3);
    accountAdjustment[objectType].totals.accountRoadmap.month3.cGPAmount = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPAmount_M3);
    accountAdjustment[objectType].totals.accountRoadmap.month3.cGPProcents = getAttributesProcents(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPProcents_M3);

    accountAdjustment[objectType].totals.accountRoadmap.quarter.revenue = getAttributes(element.commitAccountExpected[0], columnNames.revenue_Qtr);
    accountAdjustment[objectType].totals.accountRoadmap.quarter.cost = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cost_Qtr);
    accountAdjustment[objectType].totals.accountRoadmap.quarter.cGPAmount = getAttributes(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPAmount_Qtr);
    accountAdjustment[objectType].totals.accountRoadmap.quarter.cGPProcents = getAttributesProcents(element.signingsCommmitSignYieldRoadmap[0], columnNames.cGPProcents_Qtr);

    //  w/w

    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.revenue = getAttributes(element.commitWW[0], columnNames.revenue_M1);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.cost = getAttributes(element.commitWW[0], columnNames.cost_M1);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.cGPAmount = getAttributes(element.commitWW[0], columnNames.cGPAmount_M1);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.cGPProcents = {};
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.revenue.value, accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month1.cGPAmount.value);

    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.revenue = getAttributes(element.commitWW[0], columnNames.revenue_M2);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.cost = getAttributes(element.commitWW[0], columnNames.cost_M2);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.cGPAmount = getAttributes(element.commitWW[0], columnNames.cGPAmount_M2);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.cGPProcents = {};
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.revenue.value, accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month2.cGPAmount.value);


    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.revenue = getAttributes(element.commitWW[0], columnNames.revenue_M3);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.cost = getAttributes(element.commitWW[0], columnNames.cost_M3);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.cGPAmount = getAttributes(element.commitWW[0], columnNames.cGPAmount_M3);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.cGPProcents = {};
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.revenue.value, accountAdjustment[objectType].totals.accountRoadmap.previousWeek.month3.cGPAmount.value);


    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.revenue = getAttributes(element.commitWW[0], columnNames.revenue_Qtr);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.cost = getAttributes(element.commitWW[0], columnNames.cost_Qtr);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.cGPAmount = getAttributes(element.commitWW[0], columnNames.cGPAmount_Qtr);
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.cGPProcents = {};
    accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.revenue.value, accountAdjustment[objectType].totals.accountRoadmap.previousWeek.quarter.cGPAmount.value);

    // Account Adjustment
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.revenue = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.revenue_Qtr);
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.revenueSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.revenue_Qtr);
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.cost = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.cost_Qtr);
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.costSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.cost_Qtr);
    accountAdjustment[objectType].totals.adjustmentApplied.quarter = sumTotalAccountAdjustments(accountAdjustment[objectType].totals.adjustmentApplied.quarter);
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPAmount = {};
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPAmount.value = Number(accountAdjustment[objectType].totals.adjustmentApplied.quarter.revenue.value) -
      Number(accountAdjustment[objectType].totals.adjustmentApplied.quarter.cost.value);
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPProcents = {};
    accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.adjustmentApplied.quarter.revenue.value, accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPAmount.value);

    if (accountAdjustment[objectType].totals.adjustmentApplied.quarter.revenue.sandbox || accountAdjustment[objectType].totals.adjustmentApplied.quarter.cost.sandbox) {
      accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPAmount.sandbox = true;
      accountAdjustment[objectType].totals.adjustmentApplied.quarter.cGPProcents.sandbox = true;
    }

    accountAdjustment[objectType].totals.adjustmentApplied.month1.revenue = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.revenue_M1);
    accountAdjustment[objectType].totals.adjustmentApplied.month1.revenueSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.revenue_M1);
    accountAdjustment[objectType].totals.adjustmentApplied.month1.cost = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.cost_M1);
    accountAdjustment[objectType].totals.adjustmentApplied.month1.costSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.cost_M1);
    accountAdjustment[objectType].totals.adjustmentApplied.month1 = sumTotalAccountAdjustments(accountAdjustment[objectType].totals.adjustmentApplied.month1);
    accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPAmount = {};
    accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPAmount.value = Number(accountAdjustment[objectType].totals.adjustmentApplied.month1.revenue.value) -
      Number(accountAdjustment[objectType].totals.adjustmentApplied.month1.cost.value);
    accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPProcents = {};
    accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.adjustmentApplied.month1.revenue.value, accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPAmount.value);
    if (accountAdjustment[objectType].totals.adjustmentApplied.month1.revenue.sandbox || accountAdjustment[objectType].totals.adjustmentApplied.month1.cost.sandbox) {
      accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPAmount.sandbox = true;
      accountAdjustment[objectType].totals.adjustmentApplied.month1.cGPProcents.sandbox = true;
    }


    accountAdjustment[objectType].totals.adjustmentApplied.month2.revenue = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.revenue_M2);
    accountAdjustment[objectType].totals.adjustmentApplied.month2.revenueSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.revenue_M2);
    accountAdjustment[objectType].totals.adjustmentApplied.month2.cost = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.cost_M2);
    accountAdjustment[objectType].totals.adjustmentApplied.month2.costSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.cost_M2);
    accountAdjustment[objectType].totals.adjustmentApplied.month2 = sumTotalAccountAdjustments(accountAdjustment[objectType].totals.adjustmentApplied.month2);
    accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPAmount = {};
    accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPAmount.value = Number(accountAdjustment[objectType].totals.adjustmentApplied.month2.revenue.value) -
      Number(accountAdjustment[objectType].totals.adjustmentApplied.month2.cost.value);
    accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPProcents = {};
    accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.adjustmentApplied.month2.revenue.value, accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPAmount.value);
    if (accountAdjustment[objectType].totals.adjustmentApplied.month2.revenue.sandbox || accountAdjustment[objectType].totals.adjustmentApplied.month2.cost.sandbox) {
      accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPAmount.sandbox = true;
      accountAdjustment[objectType].totals.adjustmentApplied.month2.cGPProcents.sandbox = true;
    }

    accountAdjustment[objectType].totals.adjustmentApplied.month3.revenueSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.revenue_M3);
    accountAdjustment[objectType].totals.adjustmentApplied.month3.revenue = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.revenue_M3);
    accountAdjustment[objectType].totals.adjustmentApplied.month3.costSign = getAttributes(element.commmitSignYieldAdjustmentAplied[0], columnNames.cost_M3);
    accountAdjustment[objectType].totals.adjustmentApplied.month3.cost = getAttributes(element.commitBacklogAdjustmentAplied[0], columnNames.cost_M3);
    accountAdjustment[objectType].totals.adjustmentApplied.month3 = sumTotalAccountAdjustments(accountAdjustment[objectType].totals.adjustmentApplied.month3);

    accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPAmount = {};
    accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPAmount.value = Number(accountAdjustment[objectType].totals.adjustmentApplied.month3.revenue.value) -
      Number(accountAdjustment[objectType].totals.adjustmentApplied.month3.cost.value);
    accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPProcents = {};
    accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPProcents.value = utilsService.calculateCGPProcents(accountAdjustment[objectType].totals.adjustmentApplied.month3.revenue.value, accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPAmount.value);
    if (accountAdjustment[objectType].totals.adjustmentApplied.month3.revenue.sandbox || accountAdjustment[objectType].totals.adjustmentApplied.month3.cost.sandbox) {
      accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPAmount.sandbox = true;
      accountAdjustment[objectType].totals.adjustmentApplied.month3.cGPProcents.sandbox = true;
    }

    return accountAdjustment;
  }

  function calculateOWRisks(data) {
    data.revenue.value = Number(data.revenue.value) + Number(data.revenueSigned.value);
    data.cost.value = Number(data.cost.value) + Number(data.costSigned.value);
    data.cGPAmount.value = Number(data.cGPAmount.value) + Number(data.cGPAmountSigned.value);
    return data;
  }

  function calculateAccountRoadmap(data) {
    if (angular.isUndefined(data.revenueSigned.value)) {
      data.revenueSigned.value = 0;
    }
    data.revenue.value = Number(data.revenue.value) + Number(data.revenueSigned.value);
    if (angular.isUndefined(data.costSigned.value)) {
      data.costSigned.value = 0;
    }
    data.cost.value = Number(data.cost.value) + Number(data.costSigned.value);
    if (angular.isUndefined(data.cGPAmountSigned.value)) {
      data.cGPAmountSigned.value = 0;
    }
    data.cGPAmount.value = Number(data.cGPAmount.value) + Number(data.cGPAmountSigned.value);

    return data;
  }

  function sumTotalAccountAdjustments(data) {
    data.revenue.value = Number(data.revenue.value) + Number(data.revenueSign.value);
    data.cost.value = Number(data.cost.value) + Number(data.costSign.value);

    return data;
  }

  function getAttributes(data, column) {
    return {
      value: data[column],
      updatable: data[column + columnNames.updatable],
      sandbox: data[column + columnNames.sandbox],
      column,
    };
  }

  function getAttributesProcents(data, column, row) {
    return getAttributesCommon(data, column, row, true);
  }

  function getAttributesCommon(data, column, row, isProcents) {
    let value = 0;
    if (isProcents) {
      value = utilsService.formatProcents(data[column]);
    } else {
      value = utilsService.formatNumber(data[column]);
    }

    return {
      value,
      updatable: data[column + columnNames.updatable],
      sandbox: data[column + columnNames.sandbox],
      column,
      row,
    };
  }
  const baseObj = {
    empty: true,
  };
  /**
	 * This is used for extracting UI data model to for Cognos response. (Bulk save function)
	 */
  function convertEditItemToUiModel(config) {
    const _baseObj = angular.copy(baseObj);
    _baseObj.row = config.name;
    const ret = {
      name: config.name,
      expended: config.expended,
      action: {
        dueDate: angular.extend({}, config.data['Action Due Date'], _baseObj),
        owner: angular.extend({}, config.data['Action Owner'], _baseObj),
        taskid: angular.extend({},config.data['Action Task_id'], _baseObj),
        RAG: angular.extend({}, config.data.RAG_load, _baseObj),
        comment: angular.extend({}, config.data['Action Comment'], _baseObj),
        richComment: angular.extend({}, config.data.Comment, _baseObj),
        review: angular.extend({}, config.data['Review'], _baseObj),
      },
      cGPPlan: angular.extend({}, config.data.cGPPlan, _baseObj),
      month1: {
        revenue: angular.extend({}, config.data['M1 Rev'], _baseObj),
        cost: angular.extend({}, config.data['M1 Cost'], _baseObj),
      },
      month2: {
        revenue: angular.extend({}, config.data['M2 Rev'], _baseObj),
        cost: angular.extend({}, config.data['M2 Cost'], _baseObj),
      },
      month3: {
        revenue: angular.extend({}, config.data['M3 Rev'], _baseObj),
        cost: angular.extend({}, config.data['M3 Cost'], _baseObj),
      },
    };
    return ret;
  }
  const ordinalMap = {
    'M1 Rev': 0,
    'M2 Rev': 1,
    'M3 Rev': 2,
    'M1 Cost': 3,
    'M2 Cost': 4,
    'M3 Cost': 5,
    'Action Comment': 6,
    'Action Task_id' : 7,
    'Action Owner': 8,
    'Action Due Date': 9,
    RAG_load: 10,
    Comment: 11,
    Review: 12, 
  };
  const ordinalMapForEuGTSMgmt = {
    'QTR Rev Mjdg': 0,
    'QTR Cost Mjdg': 1,
    'Action Comment': 2,
    'Action Task_id' : 3,
    'Action Owner': 4,
    'Action Due Date': 5,
    RAG_load: 6,
    Comment: 7,
    Review: 8,
  };

  const ordinalAccAdjMap = {
    'Action Comment': 0,
    'Action Owner': 1,
    'Action Task_id' :2,
    'Action Due Date': 3,
    RAG_load: 4,
    Comment: 5,
    Review: 6,
  };
  /**
	 * Convert UI model back to to a Cognos model.
	 */
  function convertUiModelToEditItem(model, isMgmt, isEuGts) {
    // Conver and update data vaule
    model.action.dueDate.value = utilsService.formatDateForCognos(model.action.dueDate.displayValue);
    const data = {};
    data['Action Due Date'] = model.action.dueDate;
    data['Action Owner'] = model.action.owner;
    data['Action Task_id'] = model.action.taskid;
    data.RAG_load = model.action.RAG;
    data['Action Comment'] = model.action.comment;
    data.Comment = model.action.richComment;
    if (!isMgmt && isEuGts === true) {
      data['Review'] = model.action.review;
    }
    if (isMgmt === true && isEuGts === true) {
      data['QTR Rev Mjdg'] = model.quarter.revenue;
      data['QTR Cost Mjdg'] = model.quarter.cost;
      _fixOrdinalVal(data, true);
    } else {
      data['M1 Rev'] = model.month1.revenue;
      data['M2 Rev'] = model.month2.revenue;
      data['M3 Rev'] = model.month3.revenue;
      data['M1 Cost'] = model.month1.cost;
      data['M2 Cost'] = model.month2.cost;
      data['M3 Cost'] = model.month3.cost;
      _fixOrdinalVal(data, false);
    }
    
    return data;

    function _fixOrdinalVal(data, isMgmtEuGts) {
      Object.keys(data).forEach((item) => {
        console.log(data, item);
        data[item].ordinal = isMgmtEuGts ? ordinalMapForEuGTSMgmt[item] : ordinalMap[item];
      });
    }
  }

  function convertUiModelToEditItemAccountAdjustment(model) {
    // Conver and update data vaule
    model.action.dueDate.value = utilsService.formatDateForCognos(model.action.dueDate.displayValue);
    const data = {};
    data['Action Due Date'] = model.action.dueDate;
    data['Action Owner'] = model.action.owner;
    data['Action Task_id'] = model.action.taskid;
    data.RAG_load = model.action.RAG;
    data['Action Comment'] = model.action.comment;
    data.Comment = model.action.richComment;
    //data.Review = model.action.review;
    _fixOrdinalVal(data);
    return data;

    function _fixOrdinalVal(data) {
      Object.keys(data).forEach((item) => {
        data[item].ordinal = ordinalAccAdjMap[item];
      });
    }
  }

  function getMapKey(line) {
    if (!line.account) {
      throw new Error('Invalid account object');
    }
    if (!line.serviceLine) {
      throw new Error('Invalid service line object');
    }
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
      if (typeof line.approval === 'undefined') {
        throw new Error('Invalid approval object');
      }
      return `${line.account.Name}_${line.approval.Name}_${line.serviceLine.Name}`;
    }
    return `${line.account.Name}_${line.serviceLine.Name}`;
  }
}
