import Backlog from './Backlog';
import Signings from './Signings';
import Totals from './Totals';
import TotalsEuGts from './TotalsEuGts';

module.exports = ManagementJudgementEuGtsService;

const angular = require('angular');

ManagementJudgementEuGtsService.$inject = ['$q', 'NodesHierarchyCachedDataService', 'CognosService',
  'CognosDimentionService', 'CognosResponseService', 'FilterService', 'asyncService', 'utilsService',
  'ErrorService', 'StaticMappingService', 'UserSettingsService', 'ManagementJudgementService'];

function ManagementJudgementEuGtsService($q, NodesHierarchyCachedDataService, CognosService,
  CognosDimentionService, CognosResponseService, FilterService, asyncService, utilsService,
  ErrorService, StaticMappingService, UserSettingsService, ManagementJudgementService) {
  const dimentions = CognosDimentionService.dimentions.RR_INPUT;
  const columnNames = CognosDimentionService.columns.RR_INPUT;
  const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
  const service = angular.extend({}, ManagementJudgementService);
  service.getAllManagementJudgement = getAllManagementJudgement;

  function getManagementJudgementData(node, showParentUnitRoadmap, parentName, riskCategoryType) {
    let riskCategoryObject = {
      backlogMgmtExpectedRiskCategory: riskCategories.commit,
      risk1Category: riskCategories.risk1,
    };

    if (riskCategoryType === 'Best Can Do') {
      riskCategoryObject = {
        backlogMgmtExpectedRiskCategory: riskCategories.bestCanDo,
        risk1Category: riskCategories.bestCanDo,
      };
    }

    if (riskCategoryType === 'Stretch') {
      riskCategoryObject = {
        backlogMgmtExpectedRiskCategory: riskCategories.stretch,
        risk1Category: riskCategories.stretch1,
      };
    }
    return $q((resolve, reject) => {
      const locals = {};
      const filter = service.getFilter(node);
      asyncService.parallel([
        // Signings Mgmt Expected

        (callback) => {
          const filterObject = angular.copy(filter);
          filterObject.serviceLine = 'All Service Lines';
          filterObject.riskCategory = riskCategoryObject.risk1Category;
          filterObject.accounts = 'Mgmt Expected - Sign Yield';
          filterObject.roadmapItemType = 'Other';
          filterObject.evaluateRowByRoadmapType = false;


          getManagementJudgementDataQuery(angular.copy(filterObject), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.riskSignYieldTBMgmtExpected = processedData.data;
            locals.signYieldRisk = processedData.data;
            if (angular.isArray(locals.riskSignYieldTBMgmtExpected) && locals.riskSignYieldTBMgmtExpected.length > 0) {
              for (let i = 0; i < locals.riskSignYieldTBMgmtExpected.length; i += 1) {
                locals.riskSignYieldTBMgmtExpected[i].account = filterObject.accounts;
                locals.riskSignYieldTBMgmtExpected[i].riskCategory = filterObject.riskCategory;
                locals.signYieldRisk[i].riskCategory = filterObject.riskCategory;
              }
            } else {
              locals.riskSignYieldTBMgmtExpected.account = filterObject.accounts;
              locals.riskSignYieldTBMgmtExpected.riskCategory = filterObject.riskCategory;
              locals.signYieldRisk.riskCategory = filterObject.riskCategory;
            }
            callback();
          });
        },

        // Backlog Unit Roadmap
        (callback) => {
          const filterObject = angular.copy(filter);
          filterObject.serviceLine = 'Account Rdmp Service Lines';
          filterObject.riskCategory = riskCategoryObject.backlogMgmtExpectedRiskCategory;
          filterObject.accounts = 'Total projects';
          if (showParentUnitRoadmap === true) {
            filterObject.node = parentName;
          }
          filterObject.roadmapItemType = 'Total Roadmap Item Type';
          filterObject.evaluateRowByRoadmapType = false;
          filterObject.doNotFilterByAction = true;
          filterObject.measureToFilter = 'QTR Rev';
          getManagementJudgementDataQuery(angular.copy(filterObject), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.signUnitRoadmap = processedData.data;
            callback();
          });
        },

        // Signings management applied
        (callback) => {
          const filterObject = angular.copy(filter);
          filterObject.serviceLine = 'MJDG';
          filterObject.riskCategory = riskCategoryObject.risk1Category;
          filterObject.accounts = 'Mgmt Judgement - Sign Yield';
          filterObject.roadmapItemType = 'Other';
          filterObject.evaluateRowByRoadmapType = (riskCategoryObject.backlogMgmtExpectedRiskCategory === riskCategories.commit);
          getManagementJudgementDataQuery(angular.copy(filterObject), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.riskSignYieldTBMgmtApplied = processedData.data;
            callback();
          });
        },
        (callback) => {
          const filterObject = angular.copy(filter);
          filterObject.serviceLine = 'All Service Lines';
          filterObject.riskCategory = riskCategoryObject.risk1Category;
          filterObject.accounts = 'Mgmt Expected - Sign Yield';
          filterObject.roadmapItemType = 'Total Roadmap Item Type';
          filterObject.evaluateRowByRoadmapType = (riskCategoryObject.backlogMgmtExpectedRiskCategory === riskCategories.commit);
          getManagementJudgementDataQuery(angular.copy(filterObject), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.signYieldExpected = processedData.data;
            callback();
          });
        },
      ], (err) => {
        if (err) reject(err);
        resolve(locals);
      });
    });
  }

  let measures = [columnNames.cGPProcents_Qtr, columnNames.cGPAmount_Qtr, columnNames.cGPProcents_M1,
    columnNames.cGPProcents_M2, columnNames.cGPProcents_M3, columnNames.cGPAmount_M1, columnNames.cGPAmount_M2,
    columnNames.cGPAmount_M3, columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3,
    columnNames.revenue_Qtr, columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3, columnNames.cost_Qtr,
    columnNames.actionComment,columnNames.actionTask, columnNames.actionOwner, columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment, columnNames.costMjdg_Qtr, columnNames.revenueMjdg_Qtr,];

  function getManagementJudgementDataQuery(filterObject, callback) {
    let fiter = FilterService.getFilter();
     const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
    fiter = FilterService.updateLocalFilter(fiter, dimentions.versions, filterObject.version);
    fiter = FilterService.updateLocalFilter(fiter, dimentions.riskCategories,
      filterObject.riskCategory);
    fiter = FilterService.updateLocalFilter(fiter, dimentions.serviceLines,
      filterObject.serviceLine);
    fiter = FilterService.updateLocalFilter(fiter, dimentions.timeWeeks, filterObject.week);
    fiter = FilterService.updateLocalFilter(fiter, dimentions.accounts,
      filterObject.accounts);

    let rows = `[${dimentions.approvals}].[${filterObject.node}]`;
    if (filterObject.evaluateRowByRoadmapType === true && angular.isUndefined(filterObject.doNotFilterByAction)) {
      rows = `filter(crossjoin({[${dimentions.approvals}].[${filterObject.node}]}, 
        {TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.roadmapItemType}].[${filterObject.roadmapItemType}]}, ALL , RECURSIVE)},0)}), 
        ([${CognosService.getMainCubeName()}].(
          [${dimentions.timeWeeks}].[${filterObject.week}],
        [${dimentions.riskCategories}].[${riskCategories.bestCanDo}],
        [${dimentions.measures}].[${columnNames.actionFlag}] ) >=1  )
      )`
    } else if (filterObject.evaluateRowByRoadmapType === true && filterObject.doNotFilterByAction === true) {
      rows = `filter(crossjoin({[${dimentions.approvals}].[${filterObject.node}]}, 
        {TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.roadmapItemType}].[${filterObject.roadmapItemType}]}, ALL , RECURSIVE)},0)})
        , ([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filterObject.year}],
        [${dimentions.timeQuarters}].[${filterObject.quarter}],
        [${dimentions.timeWeeks}].[${filterObject.week}],
        [${dimentions.riskCategories}].[${filterObject.riskCategory}],
        [${dimentions.serviceLines}].[${filterObject.serviceLine}],
        [${dimentions.accounts}].[${filterObject.accounts}],
        [${dimentions.measures}].[${filterObject.measureToFilter}]) <> 0 ))`;
    }

    const configCommit = {
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `${CognosDimentionService.prepareColumnsStatment(modifyMeasuresInColumnsBasedOnSuffix(measures), dimentions.measures)}`,
      ROWS: ` ${rows} `,
      WHERE: CognosDimentionService.prepareFilterStatment(fiter.dimentions, fiter.values),
      successCallback(data) {
        callback(null, data);
      },
      errorCallback(ex) {
        callback(ex, null);
      },
    };
    configCommit.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(configCommit.WHERE, filterObject.roadmapItemType);
    CognosService.mdxQuery(configCommit);
  }

  function modifyMeasuresInColumnsBasedOnSuffix(measures) {
    return measures;
  }

  function getAllTotalsByRiskCategory(pRiskCategory, parentName) {
    return $q((resolve, reject) => {

      const lMeasures = [
        columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3, columnNames.revenue_Qtr,
        columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3, columnNames.cost_Qtr,
        columnNames.cGPAmount_M1, columnNames.cGPAmount_M2, columnNames.cGPAmount_M3, columnNames.cGPAmount_Qtr,
        columnNames.cGPProcents_M1, columnNames.cGPProcents_M2, columnNames.cGPProcents_M3, columnNames.cGPProcents_Qtr,
      ];
      let fiterOjb = FilterService.getFilter();
      const filter = service.getFilter(parentName);
      fiterOjb = FilterService.updateLocalFilter(fiterOjb, dimentions.approvals, filter.node);
      fiterOjb = FilterService.updateLocalFilter(fiterOjb, dimentions.versions, filter.version);
      fiterOjb = FilterService.updateLocalFilter(fiterOjb, dimentions.riskCategories, pRiskCategory);
      fiterOjb = FilterService.updateLocalFilter(fiterOjb, dimentions.serviceLines, filter.serviceLine);
      fiterOjb = FilterService.updateLocalFilter(fiterOjb, dimentions.timeWeeks, filter.week);
      const config = {
        FROM: `[${CognosService.getMainCubeName()}]`,
        COLUMNS: CognosDimentionService.prepareColumnsStatment(lMeasures, dimentions.measures),
        ROWS: `[${dimentions.approvals}].[${parentName}]`,
        WHERE: CognosDimentionService.prepareFilterStatment(fiterOjb.dimentions, fiterOjb.values),
        successCallback(data) {
          const processedData = CognosResponseService.processJSON(data);
          resolve(processedData.data[0]);
        },
        errorCallback(ex) {
          reject(ex);
        },
      };
      config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);
      CognosService.mdxQueryInSandbox(config, null, config.successCallback, config.errorCallback);
    });
  }

  function getAllManagementJudgement(node, showParentUnitRoadmap, parentName) {
    return $q((resolve, reject) => {
      const calls = [
        getManagementJudgementData(node, showParentUnitRoadmap, parentName),
        getManagementJudgementData(node, showParentUnitRoadmap, parentName, 'Best Can Do'),
        getManagementJudgementData(node, showParentUnitRoadmap, parentName, 'Stretch'),
        getAllTotalsByRiskCategory('Commit', parentName),
        getAllTotalsByRiskCategory('Solid', parentName),
      ];
      $q.all(calls).then((values) => {
        const managementJudgement = {};

        const commitData = mergeManagementJudgement(values[0], 'Commit');
        const bestCanDoData = mergeManagementJudgement(values[1], 'Best Can Do');
        const stretchData = mergeManagementJudgement(values[2], 'Stretch');
        managementJudgement.commit = commitData.commit;
        managementJudgement.bestCanDo = bestCanDoData.bestCanDo;
        managementJudgement.stretch = stretchData.stretch;
        resolve(managementJudgement);

      }, (err) => {
        ErrorService.handleError(err);
        reject();
      });
    });
  }

  function getInitialManagementJudgementValues() {
    
    return {
      managementExpected: getDefaultValues(),
      unitRoadmap: getDefaultValues(),
      ofWhichRisk: getDefaultValues(),
      managementApplied: getDefaultValues(),
    };
  }
  function getDefaultValues() {
    return {
      month1: { previousWeek: {} },
      month2: { previousWeek: {} },
      month3: { previousWeek: {} },
      quarter: { previousWeek: {} },
      action: {},
    };
  }

  function setActionData(data, riskData, colNames) {
    data.action.comment = getAttributes(riskData, colNames.actionComment);
    data.action.owner = getAttributes(riskData, colNames.actionOwner);
    data.action.dueDate = getAttributes(riskData, colNames.actionDueDate);
    data.action.richComment = getAttributes(riskData, colNames.actionRichComment);
    data.action.RAG = getAttributes(riskData, colNames.rag_load);
    if (data.action.dueDate && data.action.dueDate.value !== 0) {
      data.action.dueDate.displayValue =
        utilsService.formatDateFromCognos(data.action.dueDate.value);
    } else {
      data.action.dueDate.displayValue = null;
    }
    data.action.comment.row = riskData.riskCategory;
    data.action.owner.row = riskData.riskCategory;
    data.action.dueDate.row = riskData.riskCategory;
    data.action.RAG.row = riskData.riskCategory;
  }

  function mergeManagementJudgement(data, riskCategoryType) {
    let objectType = 'commit';
    if (riskCategoryType === 'Best Can Do') {
      objectType = 'bestCanDo';
    }
    if (riskCategoryType === 'Stretch') {
      objectType = 'stretch';
    }
    const managementJudgement = {};
    managementJudgement[objectType] = { backlog: {}, signings: {}, totals: {} };
    managementJudgement[objectType].backlog = getInitialManagementJudgementValues();
    managementJudgement[objectType].signings = getInitialManagementJudgementValues();
    managementJudgement[objectType].totals = getInitialManagementJudgementValues();

    // Signings Management Expected
    if (data.riskSignYieldTBMgmtExpected && angular.isArray(data.riskSignYieldTBMgmtExpected) && data.riskSignYieldTBMgmtExpected.length > 0) {
      managementJudgement[objectType].signings.managementExpected =
        assignDefaultValuesFromCognos(managementJudgement[objectType].signings.managementExpected,
          data.riskSignYieldTBMgmtExpected[0], true && objectType === 'commit');
    } else {
      managementJudgement[objectType].signings.managementExpected =
        assignDefaultValuesFromCognos(managementJudgement[objectType].signings.managementExpected,
          {});
    }

    // Signings Management applied
    if (data.riskSignYieldTBMgmtApplied && angular.isArray(data.riskSignYieldTBMgmtApplied) && data.riskSignYieldTBMgmtApplied.length > 0) {
        managementJudgement[objectType].signings.managementApplied =
        assignDefaultValuesFromCognos(managementJudgement[objectType].signings.managementApplied,
          data.riskSignYieldTBMgmtApplied[0]);
        } else {
          managementJudgement[objectType].signings.managementApplied = assignDefaultValuesFromCognos(managementJudgement[objectType].signings.managementApplied,
            {});
        }

    // totals

    const signings = new Signings(
      managementJudgement[objectType].signings.managementExpected,
      managementJudgement[objectType].signings.managementApplied,
      data.signUnitRoadmap[0], utilsService, true);
    signings.calculateRoadmap();
    managementJudgement[objectType].signings = signings.getManagementJudgement();

    if (angular.isDefined(data.signYieldExpected) && angular.isArray(data.signYieldExpected) && data.signYieldExpected.length > 0) {
      setActionData(managementJudgement[objectType].signings.managementExpected,
        data.signYieldExpected[0], columnNames);
    } else if (angular.isDefined(data.signYieldRisk) && angular.isArray(data.signYieldRisk) && data.signYieldRisk.length > 0) {
      setActionData(managementJudgement[objectType].signings.managementExpected,
        data.signYieldRisk[0], columnNames);
    }
    return managementJudgement;
  }



  function getAttributes(data, column, columnInView) {
    if (columnInView) {
      return {
        value: data[column],
        updatable: data[column + columnNames.updatable],
        sandbox: data[column + columnNames.sandbox],
        column: columnInView,
      };
    } else {
      return {
        value: data[column],
        updatable: data[column + columnNames.updatable],
        sandbox: data[column + columnNames.sandbox],
        column,
      };
   }
  }

  function assignDefaultValuesFromCognos(object, data, isExpected) {
    object.quarter.revenue = getAttributes(data, isExpected ? columnNames.revenueMjdg_Qtr: columnNames.revenue_Qtr, columnNames.revenue_Qtr);
    object.quarter.cost = getAttributes(data, isExpected ? columnNames.costMjdg_Qtr: columnNames.cost_Qtr, columnNames.cost_Qtr);
    object.quarter.cGPAmount = getAttributes(data, columnNames.cGPAmount_Qtr);
    object.quarter.cGPProcents = getAttributes(data, columnNames.cGPProcents_Qtr);

    object.month1.revenue = getAttributes(data, columnNames.revenue_M1);
    object.month1.cost = getAttributes(data, columnNames.cost_M1);
    object.month1.cGPAmount = getAttributes(data, columnNames.cGPAmount_M1);
    object.month1.cGPProcents = getAttributes(data, columnNames.cGPProcents_M1);

    object.month2.revenue = getAttributes(data, columnNames.revenue_M2);
    object.month2.cost = getAttributes(data, columnNames.cost_M2);
    object.month2.cGPAmount = getAttributes(data, columnNames.cGPAmount_M2);
    object.month2.cGPProcents = getAttributes(data, columnNames.cGPProcents_M2);

    object.month3.revenue = getAttributes(data, columnNames.revenue_M3);
    object.month3.cost = getAttributes(data, columnNames.cost_M3);
    object.month3.cGPAmount = getAttributes(data, columnNames.cGPAmount_M3);
    object.month3.cGPProcents = getAttributes(data, columnNames.cGPProcents_M3);
    object.account = data.account;

    object.month1.revenue.row = data.riskCategory;
    object.month1.cost.row = data.riskCategory;
    object.month2.revenue.row = data.riskCategory;
    object.month2.cost.row = data.riskCategory;
    object.month3.revenue.row = data.riskCategory;
    object.month3.cost.row = data.riskCategory;

    if (angular.isDefined(object.month1.revenue)) {
      object.month1.revenue.value = utilsService.formatNumber(object.month1.revenue.value);
    }
    if (angular.isDefined(object.month2.revenue)) {
      object.month2.revenue.value = utilsService.formatNumber(object.month2.revenue.value);
    }
    if (angular.isDefined(object.month3.revenue)) {
      object.month3.revenue.value = utilsService.formatNumber(object.month3.revenue.value);
    }
    if (angular.isDefined(object.quarter.revenue)) {
      object.quarter.revenue.value = utilsService.formatNumber(object.quarter.revenue.value);
    }

    if (angular.isDefined(object.month1.cost)) {
      object.month1.cost.value = utilsService.formatNumber(object.month1.cost.value);
    }
    if (angular.isDefined(object.month2.cost)) {
      object.month2.cost.value = utilsService.formatNumber(object.month2.cost.value);
    }
    if (angular.isDefined(object.month3.cost)) {
      object.month3.cost.value = utilsService.formatNumber(object.month3.cost.value);
    }
    if (angular.isDefined(object.quarter.cost)) {
      object.quarter.cost.value = utilsService.formatNumber(object.quarter.cost.value);
    }

    return object;
  }

  return service;
}

