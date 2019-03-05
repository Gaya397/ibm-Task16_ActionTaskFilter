module.exports = AccountsDataService;

AccountsDataService.$inject = ['$log', '$q', 'CognosDimentionService', 'ibpCache', 'CognosService',
  'SandboxService', 'CognosResponseService', 'FilterService', 'utilsService', 'CognosConfigService',
  'busService', 'UserSettingsService'];
function AccountsDataService($log, $q, CognosDimentionService, ibpCache, CognosService,
  SandboxService, CognosResponseService, FilterService, utilsService, CognosConfigService,
  busService, UserSettingsService) {
  this.getAccountsInfo = getAccountsInfo;
  this.getSourceData = getSourceData;
  this.getRdmSourceData = getRdmSourceData;
  this.getAccountAdjustments = getAccountAdjustments;
  this.getSingleOpportunityInfo = getSingleOpportunityInfo;
  this.getUniqueArray = getUniqueArray;
  this.excludeAdditionalFieldsFromActionColumnsBasedOnFlag = excludeAdditionalFieldsFromActionColumnsBasedOnFlag;
  this.getFinancialGoals = getFinancialGoals;

  const dimentions = CognosDimentionService.dimentions.RR_INPUT;
  const columnNames = CognosDimentionService.columns.RR_INPUT;
  const serviceLines = CognosDimentionService.serviceLines.RR_INPUT;
  const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
  const weeks = CognosDimentionService.weeks.RR_INPUT;
  let additionalFieldsProperty = CognosService.CognosConfigService.prop.ADDITIONAL_FIELDS;
  let additionalFields = { queryExtra: [], ui: [] };
  parseAdditionalFields();

  busService.defaultChannel.subscribe(busService.events.DB_PROPS_LOADED, null, () => {
    additionalFieldsProperty = CognosService.CognosConfigService.prop.ADDITIONAL_FIELDS;
    parseAdditionalFields();
  });

  function parseAdditionalFields() {
    if (typeof additionalFieldsProperty !== 'undefined') {
      try {
        additionalFields = JSON.parse(additionalFieldsProperty);
      } catch (error) {
        throw new Error(`JSON.parse error at acc data service: ${error.message}`);
      }
    }
  }

  function addSlFromFilter(processedData, filter) {
    const serviceLine = { Name: filter.serviceLine };
    const atrName = CognosDimentionService.dimentions.DATA_MAPPING[dimentions.serviceLines];
    for (let i = 0; i < processedData.data.length; i += 1) {
      processedData.data[i][atrName] = serviceLine;
    }
  }
  function addAcountLevelExtras(processedData, filter) {
    const approval = { Name: filter.node };
    const atrName = CognosDimentionService.dimentions.DATA_MAPPING[dimentions.approvals];
    processedData.data.forEach((line) => {
      line[atrName] = approval;
      if (line.account === undefined) {
        line.account = { Attributes: {} };
      }
      if (line.account.Attributes === undefined) {
        line.account.Attributes = {};
      }
      line.account.Attributes['Account Name'] = line.account.Name; // Temporary solutions ASK Backend team to fix it.
    });
  }

  function getIsAccountFlag() { // NOTE This is temporary solution until data will be refactored.
    return '1';
  }

  const measuresRevenue = [
    columnNames.revenueRollOver, columnNames.costRollOver, columnNames.cGPProcentsRollOver, columnNames.revenueTBSigned_Qtr,
    columnNames.revenueBacklog_Qtr, columnNames.revenueSigned_Qtr, columnNames.pcwIdentified, columnNames.pcwPerformed, columnNames._1,
    columnNames.actionFlag,
  ];

  const measuresRevenueEuGts = [
    columnNames.revenueRollOver, columnNames.costRollOver, columnNames.cGPProcentsRollOver, columnNames.cGPAmountRollOver, columnNames.revenueTBSigned_Qtr,
    columnNames.revenueBacklog_Qtr, columnNames.revenueSigned_Qtr, columnNames.pcwIdentified, columnNames.pcwPerformed, columnNames._1,
    columnNames.actionFlag,
    columnNames.revenueRollOverY, columnNames.costRollOverY, columnNames.cGPProcentsRollOverY, columnNames.cGPAmountRollOverY, 
  ];

  const mesuresRevNonTraveltCost = {};
  mesuresRevNonTraveltCost[columnNames.cost_non_travel_M1] = columnNames.cost_M1;
  mesuresRevNonTraveltCost[columnNames.cost_non_travel_M2] = columnNames.cost_M2;
  mesuresRevNonTraveltCost[columnNames.cost_non_travel_M1_M2] = columnNames.cost_M1_M2;
  mesuresRevNonTraveltCost[columnNames.cost_non_travel_M3] = columnNames.cost_M3;
  mesuresRevNonTraveltCost[columnNames.cost_non_travel_Qtr] = columnNames.cost_Qtr;

  mesuresRevNonTraveltCost[columnNames.revenue_non_travel_M1] = columnNames.revenue_M1;
  mesuresRevNonTraveltCost[columnNames.revenue_non_travel_M2] = columnNames.revenue_M2;
  mesuresRevNonTraveltCost[columnNames.revenue_non_travel_M1_M2] = columnNames.revenue_M1_M2;
  mesuresRevNonTraveltCost[columnNames.revenue_non_travel_M3] = columnNames.revenue_M3;
  mesuresRevNonTraveltCost[columnNames.revenue_non_travel_Qtr] = columnNames.revenue_Qtr;

  mesuresRevNonTraveltCost[columnNames.cGP_non_travelAmount_M1] = columnNames.cGPAmount_M1;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelAmount_M2] = columnNames.cGPAmount_M2;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelAmount_M1_M2] = columnNames.cGPAmount_M1_M2;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelAmount_M3] = columnNames.cGPAmount_M3;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelAmount_Qtr] = columnNames.cGPAmount_Qtr;

  mesuresRevNonTraveltCost[columnNames.cGP_non_travelProcents_M1] = columnNames.cGPProcents_M1;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelProcents_M2] = columnNames.cGPProcents_M2;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelProcents_M1_M2] =
    columnNames.cGPProcents_M1_M2;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelProcents_M3] = columnNames.cGPProcents_M3;
  mesuresRevNonTraveltCost[columnNames.cGP_non_travelProcents_Qtr] = columnNames.cGPProcents_Qtr;

  const mesuresRevRegularCost = [
    columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3,
    columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3,
    columnNames.cGPAmount_M1, columnNames.cGPAmount_M2, columnNames.cGPAmount_M3,
    columnNames.cGPProcents_M1, columnNames.cGPProcents_M2, columnNames.cGPProcents_M3,
    columnNames.pcwIdentified,
  ];

  const measuresQuarterDataOnly = [
    columnNames.revenue_Qtr, columnNames.cost_Qtr, columnNames.cGPAmount_Qtr, columnNames.cGPProcents_Qtr
  ];

  this.getRevenueOptimization = getRevenueOptimization;
  this.getRevenueMeasures = getRevenueMeasures;

  function getRevenueMeasures(travelCost) {
    let lMeasuresForRevenue = null;
    const measuresToBeUsed = UserSettingsService.isEuGtsRegion() ? measuresRevenueEuGts:  measuresRevenue; 

    if (CognosService.CognosConfigService.prop.TRAVEL_COST === true) {
      if (travelCost) {
        lMeasuresForRevenue = measuresToBeUsed.concat(Object.keys(mesuresRevNonTraveltCost));
      } else {
        lMeasuresForRevenue = measuresToBeUsed.concat(mesuresRevRegularCost);
      }
    } else {
      lMeasuresForRevenue = measuresToBeUsed.concat(mesuresRevRegularCost);
    }
    return lMeasuresForRevenue;
  }

  function getRevenue_OPTIMIZATION_Actions(filter) {
    const deferred = $q.defer();
    let lMeasuresForRevenue = [];
    if (angular.isUndefined(filter.useOnlyQuarterColumns)) {
      lMeasuresForRevenue = getRevenueMeasures(filter.travelCost);
    } else {
      lMeasuresForRevenue = getUniqueArray(measuresQuarterDataOnly, lMeasuresForRevenue);
    }
    filter.revenue.riskCategories.push(riskCategories.categories); // Do not remove this one.
    const columnsRevenueRiskExpression = filter.dataForSplitRdmp ? `[${dimentions.riskCategories}].[Risk_all], [${dimentions.riskCategories}].[Stretch_all], [${dimentions.riskCategories}].[Best Can Do], [${dimentions.riskCategories}].[Commit]`
              : `${CognosDimentionService.prepareColumnsStatment(filter.revenue.riskCategories, dimentions.riskCategories)}` +
              `${CognosDimentionService.prepareColumnsSetStatment(filter.revenue.riskCategorySets, dimentions.riskCategories)}`;
    const config = {
      parent: true,
      isRevenue: true,
      nonEmpty: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS:
        `CROSSJOIN({${CognosDimentionService.prepareColumnsStatment(filter.revenue.weeks, dimentions.timeWeeks)}},` +
        `CROSSJOIN({${columnsRevenueRiskExpression} },` +
        `{${CognosDimentionService.prepareColumnsStatment(lMeasuresForRevenue, dimentions.measures)}}` +
        ' ) )',
      ROWS: `filter( CROSSJOIN([${dimentions.serviceLines}].[${serviceLines.activeSL}],` +
        `[${dimentions.accounts}].[${filter.account}]), ` +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}] ) >=1  ))`,

      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeQuarters}].[${filter.quarter}]`,
        `[${dimentions.timeYears}].[${filter.year}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
      ],
      successCallback(data) {
        const options = {
          hierarchies: true,
          cellHierarchies: true,
          setAliases: [],
        };
        let processedData;
        try {
          processedData = CognosResponseService.processJSON(data, options);
        } catch (e) {
          deferred.reject(e);
          return;
        }
        updateSets(processedData);
        if (filter.serviceLine === serviceLines.totalServiceLines) {
          addSlFromFilter(processedData, filter);
        }
        if (CognosService.CognosConfigService.prop.TRAVEL_COST === true && filter.travelCost === true) {
          renameObjectsTravelCostFlag(processedData);
        }
        deferred.resolve(processedData.data);
      },
      errorCallback(ex) {
        $log.info('Error', ex);
        deferred.reject(ex);
      },
    };
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
      config.ROWS =
        'FILTER(' +
        'nonempty( ';
      if (filter.serviceLine !== serviceLines.totalServiceLines) {
        config.ROWS += `nonempty([${dimentions.serviceLines}].[${filter.serviceLine}], ` +
          '{(' +
          `[${dimentions.timeWeeks}].[${filter.week}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${columnNames.actionFlag}])})` +
          ' * ';
      } else {
        config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      }
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        config.ROWS += ` nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.roadmapItemType}].[${CognosDimentionService.roadmapItemTypes.RR_INPUT.totalRoadmapItemType}]}, ALL , RECURSIVE)},0)}, ` +
          '{(' +
          `[${dimentions.timeWeeks}].[${filter.week}],` +
          `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${columnNames.actionFlag}])}) * `;
      }

      config.ROWS += `nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.approvals}].[${filter.node}]}, ALL , RECURSIVE)},0)},` +
        '{(' +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])})` +
        ' * ' +
        `nonempty({TM1FILTERBYLEVEL( {TM1SUBSETALL( [${dimentions.accounts}] )}, 0)},` +
        '{(' +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])}),` +

        '{(' +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])})` +
        ',' +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])>=1 ) ) `;
    } else if (filter.serviceLine === serviceLines.totalServiceLines) {
      config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      config.ROWS = `${'filter(' +
        '['}${dimentions.accounts}].[${filter.account}],` +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}] ) >=1  ))`;
    }
    if (filter.viewLevel === 'account') { // Account Level. This is posiible in Account RDM ONLY
      config.ROWS = `${'nonempty(' +
        '{TM1SORT({FILTER({TM1SUBSETALL( ['}${dimentions.accounts}] )}, [${dimentions.accounts}].[Is Account] = ${getIsAccountFlag()})}, ASC)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])} )`;
    }
    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);
    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);

    function updateSets(processedData) {
      const setAliases_update = angular.copy(processedData.columns._setAliases);
      processedData.data.forEach((line) => {
        for (const key in processedData.columns._setAliases) {
          const setName = processedData.columns._setAliases[key];
          const set = line[setName];
          const set_pros = line[`${setName}_props`];
          const revItemName = getRevenueSetName(set_pros);
          if (revItemName != null) {
            line[revItemName] = set;
            line[`${revItemName}_props`] = set_pros;
            delete line[setName];
            delete line[`${setName}_props`];
            setAliases_update[key] = revItemName;
          } else {
            delete line[setName];
            delete line[`${setName}_props`];
            setAliases_update[key] = `${setName}_deleted`;
          }
        }
      });
      processedData.columns._setAliases = setAliases_update;
    }
    function getRevenueSetName(pros) {
      let name = null;
      const week = pros[0].Name;
      const category = pros[1].Name;

      name = category;
      name = name[0].toLocaleLowerCase() + name.substring(1);
      name = name.replace(/\s+/g, '');
      name = name.replace(/-+/g, '_');

      if (week === weeks.currentWeek) {
        name += weeks.currentWeek.replace(/\s+/g, '');
      } else {
        name += 'PrevWeek';
      }
      return name;
    }
    return deferred.promise;
  }

  function renameObjectsTravelCostFlag(processedData) {
    processedData.data.forEach((line) => {
      Object.keys(line).forEach((dataKey) => {
        let _line = line[dataKey];
        Object.keys(mesuresRevNonTraveltCost).forEach((key) => {
          let _key = key.replace(/\s+/g, '_');
          let _uikey = mesuresRevNonTraveltCost[key].replace(/\s+/g, '_');
          let data = _line[_key];
          if (data != undefined) {
            _line[_uikey] = data;
            delete _line[_key];
          }

        });
      });
    });
  }

  function getRevenueOptimization(filter) {
    validateServiceLine(filter);
    if (filter.type === 'actions') {
      return getRevenue_OPTIMIZATION_Actions(filter);
    }
    const measuresForRevenue = getRevenueMeasures(filter.travelCost);
    let uniqueMeasures = [];
    if (angular.isUndefined(filter.useOnlyQuarterColumns)) {
      uniqueMeasures = getUniqueArray(measuresForRevenue, uniqueMeasures);
    } else {
      uniqueMeasures = getUniqueArray(measuresQuarterDataOnly, uniqueMeasures);
    }
    const deferred = $q.defer();
    let riskCategoriesList = CognosDimentionService.prepareColumnsStatment(filter.revenue.riskCategories, dimentions.riskCategories);
    const riskCategorySetsList = CognosDimentionService.prepareColumnsStatment(filter.revenue.riskCategorySets, dimentions.riskCategories);

    if (riskCategoriesList.length > 0 && riskCategorySetsList.length > 0) {
      riskCategoriesList += `, ${riskCategorySetsList}`;
    } else if (riskCategoriesList.length === 0 && riskCategorySetsList.length > 0) {
      riskCategoriesList = riskCategorySetsList;
    }
    let underscore = columnNames.underscore_one;
    const config = {
      nonEmpty: true,
      parent: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `${'' +
        'CROSSJOIN({'}${riskCategoriesList}},` +
        `CROSSJOIN({${CognosDimentionService.prepareColumnsStatment(filter.revenue.weeks, dimentions.timeWeeks)}},
             {${CognosDimentionService.prepareColumnsStatment(uniqueMeasures, dimentions.measures)}} ) ) `,
      ROWS: `${'FILTER(' +
        'CROSSJOIN(['}${dimentions.serviceLines}].[${serviceLines.activeSL}],[${dimentions.accounts}].[${filter.account}]), ` +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])>=1 ) )`,

      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeQuarters}].[${filter.quarter}]`,
        `[${dimentions.timeYears}].[${filter.year}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
      ],
      successCallback(data) {
        const options = {
          hierarchies: true,
          cellHierarchies: true,
          setAliases: ['solid - 1CurrentWeek', 'solid - 1PrevWeek',
            'commitCurrentWeek', 'commitPrevWeek',
            'bestCanDoCurrentWeek', 'bestCanDoPrevWeek',
            'solidCurrentWeek', 'solidPrevWeek',
            'riskCurrentWeek', 'riskPrevWeek',
            'stretchCurrentWeek', 'stretchPrevWeek'],
        };
        let processedData = null;
        try {
          processedData = CognosResponseService.processJSON(data, options);
        } catch (e) {
          deferred.reject(e);
          return;
        }
        if (filter.serviceLine === serviceLines.totalServiceLines) {
          addSlFromFilter(processedData, filter);
        }
        if (filter.viewLevel === 'account') {
          addAcountLevelExtras(processedData, filter);
        }
        if (CognosService.CognosConfigService.prop.TRAVEL_COST === true && filter.travelCost === true) {
          renameObjectsTravelCostFlag(processedData);
        }
        deferred.resolve(processedData.data);
      },
      errorCallback(ex) {
        $log.info('Error', ex);
        deferred.reject(ex);
      },
      isRevenue: true,
    };
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
      config.ROWS = 'filter( nonempty( ';

      if (filter.serviceLine !== serviceLines.totalServiceLines) {
        config.ROWS += `nonempty([${dimentions.serviceLines}].[${filter.serviceLine}], ` +
          `{([${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.timeWeeks}].[${filter.week}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${underscore}])})` +
          ' * ';
      } else {
        config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      }
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        config.ROWS += ` {TM1FILTERBYLEVEL({TM1SUBSETALL([${dimentions.roadmapItemType}])},0)} * `;
      }
      config.ROWS +=
        `{TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.approvals}].[${filter.node}]}, ALL , RECURSIVE)},0)}` +
        ' * ' +
        `{TM1FILTERBYLEVEL( {TM1SUBSETALL( [${dimentions.accounts}] )}, 0)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])}), ` +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${underscore}] ) >=1 ))`;
    } else if (filter.serviceLine === serviceLines.totalServiceLines) {
      config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      config.ROWS = `${'FILTER(' +
        '['}${dimentions.accounts}].[${filter.account}], ` +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])>=1 ) )`;
    }
    if (filter.viewLevel === 'account') { // Account Level. This is posible in Account RDM ONLY
      config.ROWS = `${'nonempty(' +
        '{TM1SORT({FILTER({TM1SUBSETALL( ['}${dimentions.accounts}] )}, [${dimentions.accounts}].[Is Account] = ${getIsAccountFlag()})}, ASC)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${underscore}])} )`;
    }
    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);

    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);
    return deferred.promise;
  }

  function getFinancialGoals(filter) {
    
    validateServiceLine(filter);
    let uniqueMeasures = []; 
    uniqueMeasures = getUniqueArray(measuresQuarterDataOnly, uniqueMeasures);
    const deferred = $q.defer();
    let riskCategoriesList = CognosDimentionService.prepareColumnsStatment(filter.revenue.riskCategories, dimentions.riskCategories);
    const config = {
      nonEmpty: true,
      parent: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `${'' +
        'CROSSJOIN({'}${riskCategoriesList}},` +
        `CROSSJOIN({${CognosDimentionService.prepareColumnsStatment(filter.revenue.weeks, dimentions.timeWeeks)}},
             {${CognosDimentionService.prepareColumnsStatment(uniqueMeasures, dimentions.measures)}} ) ) `,
      ROWS: `${'nonempty(' +
        '{TM1SORT({FILTER({TM1SUBSETALL( ['}${dimentions.accounts}] )}, [${dimentions.accounts}].[Is Account] = ${getIsAccountFlag()})}, ASC)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}], [${dimentions.measures}].[QTR Rev])} )`,
      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeQuarters}].[${filter.quarter}]`,
        `[${dimentions.timeYears}].[${filter.year}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
        `[${dimentions.riskCategories}].[${riskCategories.solid1}]`,
        `[${dimentions.serviceLines}].[${serviceLines.top}]`,
      ],
      successCallback(data) {
        const options = {
          hierarchies: true,
          cellHierarchies: true,
          setAliases: ['solid - 1CurrentWeek', 'solid - 1PrevWeek',
            'commitCurrentWeek', 'commitPrevWeek',
            'bestCanDoCurrentWeek', 'bestCanDoPrevWeek',
            'solidCurrentWeek', 'solidPrevWeek',
            'riskCurrentWeek', 'riskPrevWeek',
            'stretchCurrentWeek', 'stretchPrevWeek'],
        };
        let processedData = null;
        try {
          processedData = CognosResponseService.processJSON(data, options);
        } catch (e) {
          deferred.reject(e);
          return;
        }
        addSlFromFilter(processedData, filter);
        addAcountLevelExtras(processedData, filter);
        if (CognosService.CognosConfigService.prop.TRAVEL_COST === true && filter.travelCost === true) {
          renameObjectsTravelCostFlag(processedData);
        }
        deferred.resolve(processedData.data);
      },
      errorCallback(ex) {
        $log.info('Error', ex);
        deferred.reject(ex);
      },
      isRevenue: true,
    };

    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);

    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);
    return deferred.promise;
  
  }

  let projectInfoMeasures = [
    columnNames.roadmap_Item_Type_load, columnNames.decDate_load, columnNames.source, columnNames.industry_load,
    columnNames.legalContractNumber_load, columnNames.accountName_load,
    columnNames.contractStartDate_load, columnNames.contractEndDate_load,
    columnNames.salesStatus_load,columnNames.actionTask_id_load, columnNames.executionOwner_load, columnNames.opp_Owner_load,
    columnNames.rag_load, columnNames.business_unit, columnNames.project_Manager_load,// RAG is loaded in Actions automatically and not returned in Accounts (as there is no data)
    columnNames.contractFlag, columnNames.tcv_load,
    columnNames.opp_load, columnNames.sales_Stage_load, columnNames.roadmapItemType, columnNames.legalContractNumber
  ];

  let ippfMeasures = [
    columnNames.priority, columnNames.probability, columnNames.rag, columnNames.roadmapClass, 
  ];

  projectInfoMeasures = projectInfoMeasures.concat(utilsService.addAdditionalQueryFields(additionalFields.queryExtra, 'account'));
  busService.defaultChannel.subscribe(busService.events.DB_PROPS_LOADED, null, () => {
    const additionalCols = utilsService.addAdditionalQueryFields(additionalFields.queryExtra, 'account');
    additionalCols.forEach((col) => {
      if (projectInfoMeasures.includes(col) === false) {
        projectInfoMeasures.push(col);
      }
    });
  });
  const accountInfoMeasures = [
    columnNames.contractOpp, columnNames._1, columnNames.source,
  ];


  function getUniqueArray(source, destination) {
    source.forEach((element) => {
      if (destination.indexOf(element) === -1) {
        destination.push(element);
      }
    });
    return destination;
  }

  function excludeAdditionalFieldsFromActionColumnsBasedOnFlag(columnsToBeDisplayed, additionalFieldsQueryExtra) {
    let result = [];
    if (typeof additionalFieldsQueryExtra === 'undefined' || typeof columnsToBeDisplayed === 'undefined') {
      return result;
    }
    for (let i = 0, len = columnsToBeDisplayed.length; i < len; i++) {
      result.push(columnsToBeDisplayed[i]);
    }
    for (let i = 0, len = additionalFieldsQueryExtra.length; i < len; i++) {
      if (additionalFieldsQueryExtra[i]['excludefromaction'] && additionalFieldsQueryExtra[i]['excludefromaction'] === 'true') {
        let position = result.indexOf(additionalFieldsQueryExtra[i].name);
        if (position !== -1) {
          result.splice(position, 1);
        }
      }
    }
    return result;
  }
  /**
     * Gets all accounts and Supporting (load) information.
     *  We have to re factor data ad add new CROSJION // {TM1FILTERBYLEVEL( {TM1SUBSETALL( [rr approval_Europe] )}, 0)}
     */
  function getAccountsInfo(filter, callback) {
    let uniqueMeasures = [];
    let revenueRiskInColumnPart = '';
    let revenueRiskCategoryCondition = '';
    const underscore = columnNames.underscore_one;
    if (filter.loadOnlyIppf) {
      uniqueMeasures = getUniqueArray(ippfMeasures, uniqueMeasures);
      revenueRiskInColumnPart = ' * ' +
        `nonempty({TM1FILTERBYLEVEL( {TM1SUBSETALL( [${dimentions.riskCategories}] )}, 0)},` +
        `{([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.measures}].[${underscore}])}) `;
    } else {
      uniqueMeasures = getUniqueArray(accountInfoMeasures, uniqueMeasures);
      uniqueMeasures = getUniqueArray(angular.copy(projectInfoMeasures), uniqueMeasures);
      revenueRiskCategoryCondition = `[${dimentions.riskCategories}].[${filter.riskCategory}],`;
    }
    validateServiceLine(filter); // TODO Remove ME! I am invalid.
    
    let columnsToBeDisplayed = `${'' +
      'CROSSJOIN({['}${dimentions.timeYears}].[${filter.load.year}],[${dimentions.timeYears}].[${filter.year}]},` +
      `CROSSJOIN({[${dimentions.timeQuarters}].[${filter.load.quarter}],[${dimentions.timeQuarters}].[${filter.quarter}] }, {${
        CognosDimentionService.prepareColumnsStatment(uniqueMeasures, dimentions.measures)} } ) ) `;
    if (filter.week === CognosDimentionService.weeks.RR_INPUT.closingWeek) {
      columnsToBeDisplayed = `${'' +
        'CROSSJOIN({['}${dimentions.timeYears}].[${filter.load.year}],[${dimentions.timeYears}].[${filter.year}]},` +
        `CROSSJOIN({[${dimentions.timeQuarters}].[${filter.load.quarter}],[${dimentions.timeQuarters}].[${filter.quarter}] }, ` +
        `CROSSJOIN({[${dimentions.timeWeeks}].[${filter.week}],[${dimentions.timeWeeks}].[${CognosDimentionService.weeks.RR_INPUT.currentWeek}] },{${
          CognosDimentionService.prepareColumnsStatment(uniqueMeasures, dimentions.measures)} } ) ) ) `;
    }
    const config = {
      parent: true,
      nonEmpty: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: columnsToBeDisplayed,
      ROWS: `${'FILTER(' +
        'CROSSJOIN(['}${dimentions.serviceLines}].[${filter.serviceLine}],[${dimentions.accounts}].[${filter.account}]), ` +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])>=1 ) )`,

      WHERE: [
        `[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeWeeks}].[${filter.week}]`,
        `[${dimentions.riskCategories}].[${filter.load.riskCategory}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
      ],
      successCallback(data) {
        const options = {
          hierarchies: true,
          setAliases: ['load'],
        };
        const processedData = CognosResponseService.processJSON(data, options);
        if (filter.serviceLine === serviceLines.totalServiceLines) {
          addSlFromFilter(processedData, filter);
        }
        if (filter.viewLevel === 'account') {
          addAcountLevelExtras(processedData, filter);
        }
        callback(null, processedData.data);
      },
      errorCallback(ex) {
        callback(ex);
      },
    };
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG == true) {
      config.ROWS =
        'FILTER(' +
        'nonempty( ';
      if (filter.serviceLine !== serviceLines.totalServiceLines) {
        config.ROWS += `nonempty([${dimentions.serviceLines}].[${filter.serviceLine}], ` +
          `{([${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${underscore}])})` +
          ' * ';
      } else {
        config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      }
      config.ROWS += `nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.approvals}].[${filter.node}]}, ALL , RECURSIVE)},0)},` +
        `{([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])})` +
        ' * ' +
        `nonempty({TM1FILTERBYLEVEL( {TM1SUBSETALL( [${dimentions.accounts}] )}, 0)},` +
        `{([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])}) ${revenueRiskInColumnPart}`;
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        config.ROWS += ` * nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.roadmapItemType}].[${CognosDimentionService.roadmapItemTypes.RR_INPUT.totalRoadmapItemType}]}, ALL , RECURSIVE)},0)}, ` +
          `{([${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${underscore}])}) `;
      }
      config.ROWS += `, {([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `${revenueRiskCategoryCondition}` +
        `[${dimentions.measures}].[${underscore}])}) ` +
        ',' +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])>=1 ) ) `;
      if (filter.viewLevel === 'account') { // Account Level. This is posible in Account RDM ONLY
        config.ROWS = `nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.approvals}].[${filter.node}]}, ALL , RECURSIVE)},0)},` +
          `{([${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${underscore}])})` +
          ' * ' +
          ` [${dimentions.accounts}].[${filter.account}]`;
      }
    } else if (filter.serviceLine === serviceLines.totalServiceLines) {
      config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      config.ROWS = `${'FILTER(' +
        '['}${dimentions.accounts}].[${filter.account}], ` +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])>=1 ) )`;
    }
    if (filter.viewLevel === 'account') { // Account Level. This is posible in Account RDM ONLY
      config.ROWS = `${'nonempty(' +
        '{TM1SORT({FILTER({TM1SUBSETALL( ['}${dimentions.accounts}] )}, [${dimentions.accounts}].[Is Account] = ${getIsAccountFlag()})}, ASC)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${underscore}])} )`;
    }

    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);
    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);
  }

  const actionMeasures = [
    columnNames.roadmap_Item_Type_load, columnNames.contractOpp,
    columnNames.actionComment,columnNames.actionTask, columnNames.actionOwner, columnNames.actionDueDate,
    columnNames.rag_load, columnNames.actionFlag, columnNames.opp_load, columnNames.roadmapItemType,
    columnNames.oppyOwner, columnNames.decDate_load, columnNames.executionOwner_load,
    columnNames.rag_load, columnNames.business_unit, columnNames.project_Manager, columnNames.opp_Owner,
    columnNames.salesStatus,columnNames.actionTaskid, columnNames.executionOwner, columnNames.contractStartDate,
    columnNames.contractEndDate, columnNames.decDate, columnNames.ss_load, columnNames.actionTaskid_load,
    columnNames.sales_Stage_load, columnNames.sales_Stage, columnNames.actionRichComment, columnNames.legalContractNumber,
  ];

  this.getActions = (filter) => {
    const deferred = $q.defer();
    validateServiceLine(filter);
    const actionsMeasuresToBeRetrieved = actionMeasures;
    if (UserSettingsService.isEuGtsRegion()) {
      actionsMeasuresToBeRetrieved.push(columnNames.review);
    }
    let measuresToBeRetrieved = `{${
      CognosDimentionService.prepareColumnsStatment(actionMeasures, dimentions.measures)},${
      CognosDimentionService.prepareColumnsStatment(this.excludeAdditionalFieldsFromActionColumnsBasedOnFlag(projectInfoMeasures, additionalFields.queryExtra), dimentions.measures)
    }`;
    if (filter.loadOnlyIppf) {
      measuresToBeRetrieved += `, ${CognosDimentionService.prepareColumnsStatment(ippfMeasures, dimentions.measures)}`;
    }
    const riskCategoryExpressionInColumns = filter.dataForSplitRdmp ? `[${dimentions.riskCategories}].[Risk_all], [${dimentions.riskCategories}].[Stretch_all], [${dimentions.riskCategories}].[Solid-1]`
                : `TM1FILTERBYLEVEL( {TM1DRILLDOWNMEMBER( {[${dimentions.riskCategories}].[${filter.riskCategory}]}, ALL , RECURSIVE )}, 0)`;
    const config = {
      parent: true,
      nonEmpty: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS:
        `CROSSJOIN({[${dimentions.timeYears}].[${filter.load.year}],[${dimentions.timeYears}].[${filter.year}]},` +
        `CROSSJOIN({[${dimentions.timeQuarters}].[${filter.load.quarter}],[${dimentions.timeQuarters}].[${filter.quarter}] },` +
        `CROSSJOIN( {${riskCategoryExpressionInColumns}},` +
        `${measuresToBeRetrieved}} ) ) )`,
      ROWS: `${'filter(' +
        'CROSSJOIN( ['}${dimentions.serviceLines}].[${filter.serviceLine}],` +
        `[${dimentions.accounts}].[${filter.account}]),` +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])>=1 )` +
        ')',
      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeWeeks}].[${filter.week}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
      ],
      successCallback(data) {
        const options = {
          hierarchies: true,
          setAliases: ['load'],
        };
        try {
          const processedData = CognosResponseService.processJSON(data, options);
          fromSetsWhereFlagIsNotEqToOne(processedData);

          if (filter.serviceLine === serviceLines.totalServiceLines) {
            addSlFromFilter(processedData, filter);
          }

          deferred.resolve(processedData.data);
        } catch (e) {
          deferred.reject(e);
        }
      },
      errorCallback(err) {
        deferred.reject(err);
      },
    };
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
      config.ROWS =
        'FILTER(' +
        'nonempty( ';
      if (filter.serviceLine !== serviceLines.totalServiceLines) {
        config.ROWS += `nonempty([${dimentions.serviceLines}].[${filter.serviceLine}], ` +
          `{([${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${columnNames.actionFlag}])})` +
          ' * ';
      } else {
        config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      }

      config.ROWS += `nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.approvals}].[${filter.node}]}, ALL , RECURSIVE)},0)},` +
        `{([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])})` +
        ' * ' +
        `nonempty({TM1FILTERBYLEVEL( {TM1SUBSETALL( [${dimentions.accounts}] )}, 0)},` +
        `{([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])}), ` +

        `{([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])}) `;
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        config.ROWS += ` * nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.roadmapItemType}].[${CognosDimentionService.roadmapItemTypes.RR_INPUT.totalRoadmapItemType}]}, ALL , RECURSIVE)},0)}, ` +
          `{([${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
          `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
          `[${dimentions.measures}].[${columnNames.actionFlag}])}) `;
      }
      config.ROWS += ',' +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])>=1 ) ) `;
    } else if (filter.serviceLine === serviceLines.totalServiceLines) {
      config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
      config.ROWS = `${'FILTER(' +
        '['}${dimentions.accounts}].[${filter.account}], ` +
        `([${CognosService.getMainCubeName()}].([${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])>=1 ))`;
    }
    if (filter.viewLevel === 'account') { // Account Level. This is posible in Account RDM ONLY
      config.ROWS = `${'nonempty(' +
        '{TM1SORT({FILTER({TM1SUBSETALL( ['}${dimentions.accounts}] )}, [${dimentions.accounts}].[Is Account] = ${getIsAccountFlag()})}, ASC)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${columnNames.actionFlag}])} )`;
    }
    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);
    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);
    return deferred.promise;

    function copyActionSupportInfo(toObject, fromObject) {
      Object.keys(fromObject).forEach((key) => {
        if (angular.isUndefined(toObject[key])) {
          toObject[key] = fromObject[key];
        }
      });
    }

    function fromSetsWhereFlagIsNotEqToOne(processedData) {
      const setprefix = 'set_';
      const extraLines = [];
      processedData.data.forEach((line) => {
        let lineActionSource;
        let selfFlag = true;

        // retrieve Source information from one of the action set.
        for (let setIndex = 1; setIndex < processedData.columns._setAliases.length; setIndex += 1) {
          const set = line[setprefix + setIndex];
          if (angular.isUndefined(lineActionSource) && angular.isDefined(set['Source'])) {
            lineActionSource = set['Source'];
          }
        }
        for (let setIndex = 1; setIndex < processedData.columns._setAliases.length; setIndex += 1) {
          const set = line[setprefix + setIndex];
          const set_props = line[`${setprefix + setIndex}_props`];
          if (set[columnNames.actionFlag] === 1) {
            let actionSource = angular.isDefined(set['Source']) ? set['Source'] : lineActionSource;
            if (selfFlag) {
              // rename set and add it line object
              line[CognosDimentionService.dimentions.DATA_MAPPING[dimentions.riskCategories]] = set_props[2];
              if (angular.isUndefined(line.action)) {
                line.action = set;
                line.action_props = set_props;
              } else {
                copyActionSupportInfo(line.action, set);
              }
              if (angular.isDefined(line.action) && (angular.isUndefined(line.action.Source) || line.action.Source === '')) {
                line.action.Source = actionSource;
              }

              selfFlag = false;
            } else {
              // create a new clone object with a appropriate risk categories
              const clone = cloneLine(line);
              clone[CognosDimentionService.dimentions.DATA_MAPPING[dimentions.riskCategories]] = set_props[2];
              clone.action = set;
              clone.action.Source = actionSource;
              clone.action_props = set_props;
              if (angular.isDefined(line['currentYearCurrent QuarterSolidQuarter'])) {
                clone['currentYearCurrent QuarterSolidQuarter'] = line['currentYearCurrent QuarterSolidQuarter'];
              }
              extraLines.push(clone);
            }
          }
          if (set[columnNames.contractFlag] === 1) {
            if (angular.isUndefined(line.action)) {
              line.action = set;
              line.action_props = set_props;
            }
          }
          if (set[columnNames.contractFlag] === 0) {
            if (angular.isUndefined(line.action)) {
              line.action = set;
              line.action_props = set_props;
            }
          }
          delete line[setprefix + setIndex];
          delete line[`${setprefix + setIndex}_props`];
        }
      });
      processedData.data = processedData.data.concat(extraLines);
    }
    function cloneLine(line) {
      return {
        account: line.account,
        approval: line.approval,
        load: line.load,
        serviceLine: line.serviceLine,
        roadmapItemType: line.roadmapItemType,
      };
    }
  };
  const sourceDataMeasures = [columnNames.contractOpp,
    columnNames.actionComment,columnNames.actionTask, columnNames.actionOwner, columnNames.actionDueDate, columnNames.actionRichComment];

  const sourceDataMeasuresRdm = [columnNames.revenue_Qtr, columnNames.cost_Qtr, columnNames.cGPAmount_Qtr,
    columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3, columnNames.cost_M1,
    columnNames.cost_M2, columnNames.cost_M3];

  function getRdmSourceData(filter) {
    let cols =
      `CROSSJOIN( {${CognosDimentionService.prepareColumnsStatment(filter.sourceData.setVersion, dimentions.versions)}},` +
      `CROSSJOIN( {${CognosDimentionService.prepareColumnsStatment(filter.sourceData.setWeeks, dimentions.timeWeeks)}},` +
      `{${CognosDimentionService.prepareColumnsStatment(sourceDataMeasuresRdm, dimentions.measures)}} ))`;
    let whereExtra = [`[${dimentions.riskCategories}].[${filter.riskCategory}]`];
    let options = {
      exposeRiskCat: true
    }
    return getSourceDataInternal(filter, cols, whereExtra, options);
  }
  function getSourceData(filter) {
    const cols =
      `CROSSJOIN({${CognosDimentionService.prepareColumnsStatment(filter.sourceData.setVersion, dimentions.versions)}},` +
      `CROSSJOIN( {${CognosDimentionService.prepareColumnsStatment(filter.sourceData.setWeeks, dimentions.timeWeeks)}},` +
      `CROSSJOIN({${CognosDimentionService.prepareColumnsStatment(filter.sourceData.riskCategories, dimentions.riskCategories)} },` +
      `{${CognosDimentionService.prepareColumnsStatment(sourceDataMeasures, dimentions.measures)}, ` +
      `DESCENDANTS([${dimentions.measures}].[${columnNames.revenue_Qtr}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.cost_Qtr}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.cGPAmount_Qtr}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.cGPProcents_M1}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.cGPProcents_M2}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.cGPProcents_M3}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.cGPProcents_Qtr}]),` +
      `DESCENDANTS( [${dimentions.measures}].[${columnNames.source}])} )))`;
    return getSourceDataInternal(filter, cols);
  }

  /**
   * Internal function. Do not expose it!
   */
  function getSourceDataInternal(filter, cols, whereExtra, options) {
    const collName = filter.type === 'actions' ? columnNames.actionFlag : columnNames._1;
    if (!options) { // init config objects.
      options = {};
    }
    const deferred = $q.defer();
    const config = {};
    config.nonEmpty = true;
    config.FROM = `[${CognosService.getMainCubeName()}]`;
    config.COLUMNS = cols;
    config.parent = false;
    config.isRevenue = true;
    config.headers = { 'X-IBP-cache': '1 hour' };

    config.WHERE = [
      `[${dimentions.timeQuarters}].[${filter.quarter}]`,
      `[${dimentions.timeYears}].[${filter.year}]`,
      `[${dimentions.approvals}].[${filter.node}]`,
    ];
    if (whereExtra) {
      config.WHERE.push(whereExtra);
    }

    if (filter.viewLevel === 'details') {
      config.WHERE.push(`[${dimentions.accounts}].[${filter.account}]`);
    }

    if (filter.serviceLine == serviceLines.activeSL) {
      config.ROWS = `filter(CROSSJOIN([${dimentions.serviceLines}].[${filter.serviceLine}],` +
        `{[${dimentions.accounts}].[${filter.account}]}),` +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.versions}].[${filter.version}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${collName}])>=1 ) )`;
    } else {
      config.ROWS = `filter(` +
        `{[${dimentions.accounts}].[${filter.account}]},` +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.versions}].[${filter.version}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${collName}])>=1 ) )`;
      config.WHERE.push(`[${dimentions.serviceLines}].[${filter.serviceLine}]`);
    }


    config.successCallback = (data) => {
      const options = {
        hierarchies: true,
        cellHierarchies: true,
      };
      const processedData = CognosResponseService.processJSON(data, options);
      updateSourceDataSetNames(processedData);
      if (filter.serviceLine != serviceLines.activeSL) {
        addSlFromFilter(processedData, filter);
      }
      if (filter.viewLevel === 'account') {
        addAcountLevelExtras(processedData, filter);
      }
      deferred.resolve(processedData.data);
    };
    config.errorCallback = deferred.reject;

    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
      config.ROWS = 'FILTER(nonempty( ';
      if (filter.serviceLine === serviceLines.activeSL) {
        config.ROWS += `nonempty([${dimentions.serviceLines}].[${filter.serviceLine}], ` +
          '{(' +
          `[${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.timeWeeks}].[${filter.week}],` +
          `[${dimentions.versions}].[${filter.version}],` +
          `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
          `[${dimentions.measures}].[${collName}])})` +
          ' * ';
      }
      // Extra where with SL was added in top code.
      config.ROWS +=
        `nonempty({TM1FILTERBYLEVEL({TM1DRILLDOWNMEMBER({[${dimentions.approvals}].[${filter.node}]}, ALL , RECURSIVE)},0)},` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.versions}].[${filter.version}],` +
        `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${collName}])})`;
      if (filter.serviceLine === serviceLines.activeSL) {
        config.ROWS +=
          ` *  nonempty({TM1FILTERBYLEVEL( {TM1SUBSETALL( [${dimentions.accounts}] )}, 0)},` +   // CROSSJOIN here
          '{(' +
          `[${dimentions.timeYears}].[${filter.year}],` +
          `[${dimentions.timeQuarters}].[${filter.quarter}],` +
          `[${dimentions.timeWeeks}].[${filter.week}],` +
          `[${dimentions.versions}].[${filter.version}],` +
          `[${dimentions.serviceLines}].[${serviceLines.totalServiceLines}],` +
          `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
          `[${dimentions.measures}].[${collName}])}), `;
      } else {
        config.ROWS +=
          `, {[${dimentions.accounts}].[${filter.account}]}, `;
      }
      config.ROWS +=
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.versions}].[${filter.version}],` +
        `[${dimentions.riskCategories}].[${filter.riskCategory}],` +
        `[${dimentions.measures}].[${collName}])}) ` +
        ',' +
        `([${CognosService.getMainCubeName()}].(` +
        `[${dimentions.timeWeeks}].[${filter.week}],` +
        `[${dimentions.versions}].[${filter.version}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${collName}])>=1 ) ) `;
    }
    if (filter.viewLevel === 'account') { // Account Level. This is posiible in Account RDM ONLY
      config.ROWS = `${'nonempty(' +
        '{TM1SORT({FILTER({TM1SUBSETALL( ['}${dimentions.accounts}] )}, [${dimentions.accounts}].[Is Account] = ${getIsAccountFlag()})}, ASC)}, ` +
        '{(' +
        `[${dimentions.timeYears}].[${filter.year}],` +
        `[${dimentions.timeQuarters}].[${filter.quarter}],` +
        `[${dimentions.riskCategories}].[${riskCategories.bestCanDo}],` +
        `[${dimentions.measures}].[${collName}])})`;
    }
    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);
    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);
    return deferred.promise;

    function updateSourceDataSetNames(processedData) {
      const setAliases = [];
      processedData.data.forEach((line) => {
        line.sourceData = {};
        processedData.columns._setAliases.forEach((set, index) => {
          let mapping = setAliases[index];
          if (!mapping) {
            mapping = getSourceDataOjtName(line[set + '_props']);
            setAliases[index] = mapping;
          }
          line.sourceData[mapping] = line[set];
          delete line[set];
          delete line[set + '_props'];
        });
      });
      processedData.columns._setAliases = setAliases;
    }
    function getSourceDataOjtName(props) {
      if (!props) {
        throw new Error('Invalid properties obj');
      }
      let ret = '';
      const riskCategoryId = options.exposeRiskCat === true ? filter.riskCategory.replace(/ +/g, '') : '';
      props.forEach((el) => {
        ret += el.Name.replace(/ +/g, '').replace('check', 'Check').replace('ClosingWk', 'CurrentWeek');
      })
      return ret + riskCategoryId;
    }
  }

  let accountAdjustmentMeasures = [
    columnNames.cGPProcents_Qtr, columnNames.cGPAmount_Qtr, columnNames.cGPProcents_M1, columnNames.cGPProcents_M2, columnNames.cGPProcents_M3,
    columnNames.cGPAmount_M1, columnNames.cGPAmount_M2, columnNames.cGPAmount_M3, columnNames.revenueBacklog_M1, columnNames.revenueBacklog_M2,
    columnNames.revenueBacklog_M3, columnNames.revenueSigned_M1, columnNames.revenueSigned_M2, columnNames.revenueSigned_M3,
    columnNames.revenueTBSigned_M1, columnNames.revenueTBSigned_M2, columnNames.revenueTBSigned_M3, columnNames.costBacklog_M1,
    columnNames.costBacklog_M2, columnNames.costBacklog_M3, columnNames.costSigned_M1, columnNames.costSigned_M2, columnNames.costSigned_M3,
    columnNames.costTBSigned_M1, columnNames.costTBSigned_M2, columnNames.costTBSigned_M3, columnNames.costBacklog_Qtr,
    columnNames.cGPProcentsBacklog_Qtr, columnNames.cGPAmountBacklog_Qtr, columnNames.costTBSigned_Qtr, columnNames.cGPAmountTBSigned_Qtr,
    columnNames.cGPProcentsTBSigned_Qtr, columnNames.costSigned_Qtr, columnNames.cGPAmountSigned_Qtr, columnNames.cGPProcentsSigned_Qtr,
    columnNames.revenueBacklog_Qtr, columnNames.cGPAmountBacklog_M1, columnNames.cGPAmountBacklog_M2, columnNames.cGPAmountBacklog_M3,
    columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3, columnNames.revenue_Qtr,
    columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3, columnNames.cost_Qtr, columnNames.cGPAmountSigned_M1, columnNames.cGPAmountSigned_M2,
    columnNames.cGPAmountSigned_M3, columnNames.cGPAmountTBSigned_M1, columnNames.cGPAmountTBSigned_M2, columnNames.cGPAmountTBSigned_M3,
    columnNames.actionComment,columnNames.actionTask, columnNames.actionOwner, columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment,
  ];

  if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
    accountAdjustmentMeasures = [columnNames.cGPProcents_Qtr, columnNames.cGPAmount_Qtr, columnNames.cGPProcents_M1,
      columnNames.cGPProcents_M2, columnNames.cGPProcents_M3, columnNames.cGPAmount_M1, columnNames.cGPAmount_M2,
      columnNames.cGPAmount_M3, columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3,
      columnNames.revenue_Qtr, columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3, columnNames.cost_Qtr,
      columnNames.actionComment, columnNames.actionTask,columnNames.actionOwner, columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment];
  }

  function getAccountAdjustments(filter, callback) {
    const configAccountData = {
      parent: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `DESCENDANTS( [${dimentions.measures}].[${columnNames.zeroCheck}]),${
        CognosDimentionService.prepareColumnsStatment(accountAdjustmentMeasures, dimentions.measures)}`,
      ROWS: ` [${dimentions.accounts}].[${filter.account}] `,
      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeQuarters}].[${filter.quarter}]`,
        `[${dimentions.timeYears}].[${filter.year}]`,
        `[${dimentions.riskCategories}].[${filter.riskCategory}]`,
        `[${dimentions.serviceLines}].[${filter.serviceLine}]`,
        `[${dimentions.timeWeeks}].[${filter.week}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
      ],
      successCallback(data) {
        callback(null, data);
      },
      errorCallback(ex) {
        callback(ex, null);
      },
    };
    configAccountData.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(configAccountData.WHERE, filter.roadmapItemType);
    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(configAccountData, '1 day');
    CognosService.mdxQueryInSandbox(configAccountData, filter.sandbox, configAccountData.successCallback, configAccountData.errorCallback);
  }
  function validateServiceLine(filter) {
    if (filter.serviceLine !== serviceLines.totalServiceLines) {
      filter.serviceLine = serviceLines.activeSL;
    }
  }

  function getSingleOpportunityInfo(filter) {
    const deferred = $q.defer();
    const config = {
      parent: true,
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `[${dimentions.measures}].[${columnNames.source}]`,
      ROWS: `[${dimentions.accounts}].[${filter.account}]`,
      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeQuarters}].[${filter.quarter}]`,
        `[${dimentions.timeYears}].[${filter.year}]`,
        `[${dimentions.riskCategories}].[${filter.riskCategory}]`,
        `[${dimentions.timeWeeks}].[${filter.week}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
        `[${dimentions.serviceLines}].[${filter.serviceLine}]`,
      ],
      successCallback(data) {
        const processedData = CognosResponseService.processJSON(data);
        if (filter.serviceLine === serviceLines.totalServiceLines) {
          addSlFromFilter(processedData, filter);
        }
        //callback(null, processedData.data);
        deferred.resolve(processedData.data);
      },
      errorCallback(ex) {
        $log.info('Error', ex);
        deferred.reject(ex);
      },
    };
    config.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(config.WHERE);
    if (utilsService.isPreviousQuarter(filter.year, filter.quarter)) utilsService.addCacheHeader(config, '1 day');
    CognosService.mdxQueryInSandbox(config, filter.sandbox, config.successCallback, config.errorCallback);
    return deferred.promise;
  }
}
