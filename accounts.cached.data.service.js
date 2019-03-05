module.exports = AccountsCachedDataService;

const angular = require('angular');

AccountsCachedDataService.$inject = ['$log', 'accountEditCognosService', 'ibpCache', 'busService', 'AccountsDataService', '$q', 'CognosCommonQueryService',
  'CognosResponseService', 'CognosDimentionService', 'asyncService', 'utilsService', 'NodesHierarchyCachedDataService', 'SandboxService',
  'StaticMappingService', 'FilterService', 'AccountsMergeDataService', 'BackendService', 'AccountsAggregateService', 'CognosService', 'ErrorService', 'UserSettingsService'];
function AccountsCachedDataService($log, accountEditCognosService, ibpCache, busService, AccountsDataService, $q, CognosCommonQueryService,
  CognosResponseService, CognosDimentionService, asyncService, utilsService, NodesHierarchyCachedDataService, SandboxService,
  StaticMappingService, FilterService, AccountsMergeDataService, BackendService, AccountsAggregateService, CognosService, ErrorService, UserSettingsService) {
  let rootNode = null;
  if (typeof StaticMappingService.getRegionReadableProp() !== 'undefined') {
    rootNode = StaticMappingService.getRegionReadableProp().name;
  }


  const cacheEnabled = true;
  this.getRoadmapDetailsCommitData = getRoadmapDetailsCommitData;
  this.getRoadmapDetailsBestCanDoData = getRoadmapDetailsBestCanDoData;
  this.getRoadmapDetailsCommitAllData = getRoadmapDetailsCommitAllData;
  this.getRoadmapDetailsBestCanDoAllData = getRoadmapDetailsBestCanDoAllData;
  this.getRoadmapDetailsAllData = getRoadmapDetailsAllData;
  this.getAccountsInfo = getAccountsInfo;
  this.getActions = getActions;
  this.getAllAccountInfoWithFilter = getAllAccountInfoWithFilter;
  this.getAllActionsInfoWithFilter = getAllActionsInfoWithFilter;
  this.getAllRevenueDataOptimization = getAllRevenueDataOptimization;
  this.getSolidRiskStretchRevenueData = getSolidRiskStretchRevenueData;
  this.mergeRevenueData = mergeRevenueData;
  this.mergeData = mergeData;
  this.mergeActionsData = mergeActionsData;

  this.getAllAccountAdjustments = getAllAccountAdjustments;
  this.getRdmSourceData = getRdmSourceData;
  this.getAllSourceDataForExport = getAllSourceDataForExport;
  this.getAllSourceDataForAllRiskCategories = getAllSourceDataForAllRiskCategories;
  this.getSingleOpportunityInfo = getSingleOpportunityInfo;
  this.assignActionSupportInfo = assignActionSupportInfo;
  this.updateFilterExtraInfo = updateFilterExtraInfo;

  const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
  const weeks = CognosDimentionService.weeks.RR_INPUT;
  const versions = CognosDimentionService.versions.RR_INPUT;

  function getActions(filter) {
    return $q((resolve, reject) => {
      const key = ibpCache.getActionsDataKey(filter, 'ActionsData');
      $log.info('actionskey', angular.copy(key));
      const data = ibpCache.actionsDataCache.get(key);
      if (filter.refresh === true || data === undefined) {
        AccountsDataService.getActions(filter).then((processedData) => {

          resolve(processedData);
        }, (err) => {
          $log.info(err);

          reject(err);
        });
      } else {
        resolve(data);
      }
    });
  }

  function getRoadmapDetailsCommitData(filter, refresh) {
    return $q((resolve, reject) => {
      const key = ibpCache.getAccountCommitDetailsDataCacheKey(filter);
      const dataFromCache = ibpCache.accountCommitDetailsDataCache.get(key);
      if (cacheEnabled === false || refresh === true || dataFromCache === undefined) {
        accountEditCognosService.getRoadmapDetailsCommitData(filter, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      } else {
        resolve(dataFromCache);
      }
    });
  }

  function getRoadmapDetailsCommitPreviousWeekData(filter, refresh) {
    return $q((resolve, reject) => {
      const filterCopy = angular.copy(filter);
      filterCopy.week = weeks.previousWeek;
      getRoadmapDetailsCommitData(filterCopy, refresh).then(resolve, reject);
    });
  }

  function getRoadmapDetailsBestCanDoData(filter, refresh) {
    return $q((resolve, reject) => {
      const key = ibpCache.getAccountBestCanDoDetailsDataCache(filter);
      const dataFromCache = ibpCache.accountBestCanDoDetailsDataCache.get(key);
      if (cacheEnabled === false || refresh === true || dataFromCache === undefined) {
        accountEditCognosService.getRoadmapDetailsBestCanDoData(filter, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      } else {
        resolve(dataFromCache);
      }
    });
  }

  function getRoadmapDetailsBestCanDoPreviousWeekData(filter, refresh) {
    return $q((resolve, reject) => {
      const filterCopy = angular.copy(filter);
      filterCopy.week = weeks.previousWeek;
      getRoadmapDetailsBestCanDoData(filterCopy, refresh).then(resolve, reject);
    });
  }

  function getRoadmapDetailsCommitAllData(filter, refresh) {
    return $q((resolve, reject) => {
      const calls = [
        getRoadmapDetailsCommitData(filter, refresh),
        getRoadmapDetailsCommitPreviousWeekData(filter, refresh),
      ];
      $q.all(calls).then((data) => {
        const response = mergeRoadmapDetailsData(data[0], data[1]);
        response.solid = addDateDisplayValues(response.solid);
        response.risk = addDateDisplayValues(response.risk);
        resolve(response);
      }, reject);
    });
  }

  function getRoadmapDetailsBestCanDoAllData(filter, refresh) {
    return $q((resolve, reject) => {
      const calls = [
        getRoadmapDetailsBestCanDoData(filter, refresh),
        getRoadmapDetailsBestCanDoPreviousWeekData(filter, refresh),
      ];
      $q.all(calls).then((data) => {
        const response = mergeRoadmapDetailsData(data[0], data[1]);
        response.stretch = addDateDisplayValues(response.stretch);
        resolve(response);
      }, reject);
    });
  }

  function getRoadmapDetailsAllData(filter, refresh) {
    return $q((resolve, reject) => {
      const calls = [
        getRoadmapDetailsCommitAllData(filter, refresh),
        getRoadmapDetailsBestCanDoAllData(filter, refresh),
      ];
      $q.all(calls).then((data) => {
        const response = {
          commit: data[0],
          bestCanDo: data[1],
        };

        response.commit.solid = addDateDisplayValues(response.commit.solid);
        response.commit.risk = addDateDisplayValues(response.commit.risk);
        response.bestCanDo.stretch = addDateDisplayValues(response.bestCanDo.stretch);

        resolve(response);
      }, reject);
    });
  }

  function addDateDisplayValues(tab) {
    for (let i = 0; i < tab.items.length; i += 1) {
      if (tab.items[i].action.dueDate && tab.items[i].action.dueDate.value !== 0) {
        tab.items[i].action.dueDate.displayValue = new Date(utilsService.formatDateFromCognos(tab.items[i].action.dueDate.value));
      } else {
        tab.items[i].action.dueDate.displayValue = null;
      }
    }
    return tab;
  }

  function mergeRoadmapDetailsData(data, previousWeekData) {
    const result = data;
    if (result.solid) {
      mergeRiskCategory(result.solid, 'solid', previousWeekData);
    }
    if (result.risk) {
      mergeRiskCategory(result.risk, 'risk', previousWeekData);
    }
    if (result.commit) {
      mergeRiskCategory(result.commit, 'commit', previousWeekData);
    }
    if (result.stretch) {
      mergeRiskCategory(result.stretch, 'stretch', previousWeekData);
    }
    if (result.bestCanDo) {
      mergeRiskCategory(result.bestCanDo, 'bestCanDo', previousWeekData);
    }
    return result;

    function mergeRiskCategory(data, riskCategory, previousWeekData) {
      data.previousWeek = previousWeekData[riskCategory];
      if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
          if (previousWeekData[riskCategory].items) {
            previousWeekData[riskCategory].items.forEach((previousWeekItem) => {
              if (previousWeekItem.name === item.name) {
                item.previousWeek = previousWeekItem;
              }
            });
          }
        });
      }
    }
  }

  /**
     * Gets all accounts and Supporting (load) information.
     *
     */
  function getAccountsInfo(filter) {
    return $q((resolve, reject) => {
      const key = ibpCache.getRegionAccountsInfoDataCacheKey(filter);
      $log.info('accountskey', angular.copy(key));
      const data = ibpCache.accountDataCache.get(key);
      if (filter.refresh === true || data === undefined) {
        AccountsDataService.getAccountsInfo(filter, (err, processedData) => {
          if (err) return reject(err);
          resolve(processedData);
        });
      } else {
        resolve(data);
      }
    });
  }

  /**
     * Adds extra info in filter
     */
  function updateFilterExtraInfo(filter) {
    const deferred = $q.defer();
    NodesHierarchyCachedDataService.getNodeByNodeName(filter.node).then((nodeData) => {
      if ((nodeData && nodeData.lowest) || CognosService.CognosConfigService.prop.LOWEST_NODE_LOCK_ONLY === 'false') {
        SandboxService.getLockInformationForNode(filter.node, rootNode).then((lockInfo) => {
          if (lockInfo && lockInfo.sandbox) {
            filter.sandbox = lockInfo.sandbox;
          }
          deferred.resolve(filter);
        });
      } else {
        deferred.resolve(filter);
      }
    }, deferred.reject);

    return deferred.promise;
  }

  function getAllAccountInfoWithFilter(filterObj, refresh) {
    const deferred = $q.defer();
    const t0 = performance.now();
    filterObj.sandbox = undefined; // Why ????
    const versions = CognosDimentionService.versions.RR_INPUT;
    updateFilterExtraInfo(filterObj).then((filter) => {
      if (refresh) {
        filter.refresh = refresh;
      }
      $log.info('getAllAccountInfoWithFilter filterObj', angular.copy(filter));
      // filter for previous quarter
      const previousQuarterFilter = preparePreviousQuarterFilter(angular.copy(filter));
      previousQuarterFilter.useOnlyQuarterColumns = true;
      previousQuarterFilter.week = utilsService.getWeekType(previousQuarterFilter.year,
        parseInt(previousQuarterFilter.quarter.split(' ')[0], 10));

      // filter for previous year
      const previousYearFilter = angular.copy(filter);
      previousYearFilter.useOnlyQuarterColumns = true;
      previousYearFilter.week = CognosDimentionService.weeks.RR_INPUT.closingWeek;
      previousYearFilter.year--;
      const calls = [
        getAccountsInfo(angular.copy(filter)),
        getAllRevenueDataOptimization(angular.copy(filter)),
        NodesHierarchyCachedDataService.getNodesHierarchy(),
      ];
      if (filter.viewLevel === 'account') {
        calls.push(getAllRevenueDataOptimization(previousQuarterFilter));
        calls.push(getAllRevenueDataOptimization(previousYearFilter));
      }
      if (UserSettingsService.isEuGtsRegion()) {
        let ippfFilter = angular.copy(filter); 
        ippfFilter.version = versions.loadIPPF; 
        ippfFilter = preProcessFilterForRevenueData(ippfFilter);
        ippfFilter.load.riskCategory = CognosDimentionService.riskCategories.RR_INPUT.bestCanDo;
        ippfFilter.loadOnlyIppf = true;
        calls.push(getAccountsInfo(ippfFilter));
      }
      if (CognosService.CognosConfigService.prop.ENABLE_FINANCIAL_GOALS === true) {
        let financialGoalsFilter = angular.copy(filter); 
        financialGoalsFilter.version = versions.financialGoals; 
        financialGoalsFilter = preProcessFilterForRevenueData(financialGoalsFilter);
        calls.push(AccountsDataService.getFinancialGoals(financialGoalsFilter));
      }
      $q.all(calls).then((values) => {
        const t1 = performance.now();
        $log.info(`TIME: Call to getAllAccountInfoWithFilter took ${t1 - t0} milliseconds.`);
        const data = mergeData(values, filterObj.riskCategory);
        const t2 = performance.now();
        $log.info(`To merge data takes: ${t2 - t1} milliseconds.`);
        deferred.resolve(data);
      }, (err) => {
        if (utilsService.checkMissingAccountsSubsetCase(err, 'Syntax error at or near:') ||
          utilsService.checkMissingAccountsSubsetCase(err, 'member not found (rte 81)') ||
          utilsService.checkMissingAccountsSubsetCase(err, 'C01: data set is invalid from Cognos')) {
          deferred.resolve([]);
        } else {
          deferred.reject(err);
        }
      });
    });

    return deferred.promise;
  }

  /**
   * evaluate previous quarter quarter and year values for current filter value. 
   * @param {filter} filter to be checked and processed
   * @returns processed filter.
   */
  function preparePreviousQuarterFilter(filter) {
    if (angular.isUndefined(filter) || angular.isUndefined(filter.quarter)) {
      return filter;
    }
    const filterQuarter = filter.quarter;
    if (filterQuarter.indexOf('1') !== -1) {
      filter.quarter = '4 Quarter';
      filter.year--;
    } else if (filterQuarter.indexOf('2') !== -1) {
      filter.quarter = '1 Quarter';
    } else if (filterQuarter.indexOf('3') !== -1) {
      filter.quarter = '2 Quarter';
    } else if (filterQuarter.indexOf('4') !== -1) {
      filter.quarter = '3 Quarter';
    }
    return filter;
  }

  this.preparePreviousQuarterFilter = preparePreviousQuarterFilter;


  /**
     * Get all actions related info (revenue, project data, actions)
     *
     */
  function getAllActionsInfoWithFilter(filterObj, refresh) {
    const deferred = $q.defer();
    const t0 = performance.now();
    if (refresh) {
      filterObj.refresh = refresh;
    }
    filterObj.sandbox = undefined;
    updateFilterExtraInfo(filterObj).then((filter) => {
      if (UserSettingsService.isEuGtsRegion()) {
        filter.loadOnlyIppf = true; 
      }
      const calls = [
        getActions(angular.copy(filter)),
        getAllRevenueDataOptimization(angular.copy(filter)),
        NodesHierarchyCachedDataService.getNodesHierarchy(),
      ];
      $q.all(calls).then((values) => {
        const t1 = performance.now();
        const data = mergeActionsData(values, filterObj.riskCategory);
        const t2 = performance.now();
        $log.info(`TIME: Call to getAllActionsInfoWithFilter took ${t1 - t0} milliseconds.`);
        $log.info(`To merge data takes: ${t2 - t1} milliseconds.`);
        deferred.resolve(data);
      }, (err) => {
        if (utilsService.checkMissingAccountsSubsetCase(err, 'Syntax error at or near:') ||
          utilsService.checkMissingAccountsSubsetCase(err, 'member not found (rte 81)') ||
          utilsService.checkMissingAccountsSubsetCase(err, 'C01: data set is invalid from Cognos')) {
          deferred.resolve([]);
        } else {
          deferred.reject(err);
        }
      });
    });
    return deferred.promise;
  }

  function assignActionSupportInfo(objectTo, objectFrom, keyTo, keyFrom) {
    if (angular.isDefined(objectTo)) {
      if ((angular.isUndefined(objectTo[keyTo]) || (angular.isDefined(objectTo[keyTo]) && ('' === objectTo[keyTo] || objectTo[keyTo] === 0)))
        && (angular.isDefined(objectFrom) && angular.isDefined(objectFrom[keyFrom]))
        && objectFrom[keyFrom] !== '' && objectFrom[keyFrom] !== 0) {
        objectTo[keyTo] = objectFrom[keyFrom];
      }
    }
  }

  function mergeActionsData(values, riskCategory) {
    const data = values[0];

    const revenueHashMap = {};
    const regionName = StaticMappingService.getRegionReadableProp().name; 
    values[1].forEach((line, index) => {
      if (angular.isUndefined(line.account)) {
        $log.error('Invalid account obj', line);
        values[1].splice(index, 1);
        return;
      }
      const objectKeys = Object.keys(line).filter((key) => {
        if ((key.indexOf('risk') !== -1 ||
          key.indexOf('stretch') !== -1 || key.indexOf('solid') !== -1) && key.indexOf('_props') === -1) {
          return key;
        }
      });

      objectKeys.forEach((key) => {
        if (key.indexOf('CurrentWeek') !== -1) {
          if (line.account == undefined) {
            $log.error('Invalid account obj', line);
            return;
          }
          const hashCode = `${getMapKey(line)}_${key.replace('CurrentWeek', '')}`;
          if (revenueHashMap[hashCode] === undefined) {
            revenueHashMap[hashCode] = { code: hashCode, line: {} };
          }
          revenueHashMap[hashCode].line.CurrentWeek = line[key];
          if (key.indexOf('stretch') === -1) {
            revenueHashMap[hashCode].line.commitCurrentWeek = line[key];
          }
          revenueHashMap[hashCode].line.bestCanDoCurrentWeek = line[key];
        }
        if (key.indexOf('PrevWeek') !== -1) {
          const hashCode = `${getMapKey(line)}_${key.replace('PrevWeek', '')}`;
          if (revenueHashMap[hashCode] === undefined) {
            revenueHashMap[hashCode] = { code: hashCode, line: {} };
          }
          revenueHashMap[hashCode].line.PrevWeek = line[key];
          if (key.indexOf('stretch') === -1) {
            revenueHashMap[hashCode].line.commitPrevWeek = line[key];
          }
          revenueHashMap[hashCode].line.bestCanDoPrevWeek = line[key];
        }
      });
    });

    delete values[1];
    let sources = ['action', 'currentYearCurrentWeek', 'currentYearCurrent QuarterSolidQuarter'];
    data.forEach((line, index) => {
      if (angular.isUndefined(line.account)) {
        $log.error('Invalid line obj', line);
        data.splice(index, 1);
        return; // Skip this line as it is invalid
      }
      if (angular.isUndefined(line.action)) {
        $log.error('Invalid line obj action', line);
        data.splice(index, 1);
        return; // Skip this line as it is invalid
      }
      if (typeof line.action['Business Unit'] !== 'undefined' && line.action['Business Unit'] !== '') {
        line.account.Attributes['RR Approval'] = line.action['Business Unit'];
      }
      if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
        line.account.buName = values[2].map[line.approval.Name].Caption || values[2].map[line.approval.Name].Name;
      } else {
        line.account.buName = values[2].map[line.account.Attributes['RR Approval']].Caption || values[2].map[line.account.Attributes['RR Approval']].Name;
      }

      if (regionName === 'North America (GBS)') {
        line.serviceLine.slName = line.serviceLine.Parent.Attributes.Caption || line.serviceLine.Parent.Name;
        line.serviceLine.practiceName = line.serviceLine.Attributes.Caption || line.serviceLine.Name;
      }

      if (angular.isUndefined(line.load)) {
        line.load = {};
      }
      assignActionSupportInfo(line.load, line.action, 'Roadmap Item Type_load', 'Roadmap Item Type');
      assignActionSupportInfo(line.load, line.action, 'Roadmap Item Type_load', 'Roadmap Item Type_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Roadmap Item Type_load'), 'Roadmap Item Type_load', 'Roadmap Item Type_load');
      if (regionName === 'Europe (GTS)') {
        assignActionSupportInfo(line.load, line.action, 'Legal Contract Number_load', 'Legal Contract Number');
      } else {
        assignActionSupportInfo(line.load, line.account.Attributes, 'Legal Contract Number_load', 'Legal Contract Number');
      }
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Project Manager'), 'Project Manager_load', 'Project Manager');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Project Manager_load'), 'Project Manager_load', 'Project Manager_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Sales Status'), 'Sales Status_load', 'Sales Status');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Sales Status_load'), 'Sales Status_load', 'Sales Status_load');

      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Action Task_id'), 'Action Task_id_load', 'Action Task_id');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Action Task_id_load'), 'Action Task_id_load', 'Action Task_id_load');


      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Oppy Owner'), 'Oppy Owner_load', 'Oppy Owner');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Oppy Owner_load'), 'Oppy Owner_load', 'Oppy Owner_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Execution Owner'), 'Execution Owner_load', 'Execution Owner');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Execution Owner_load'), 'Execution Owner_load', 'Execution Owner_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Dec Date'), 'Dec Date_load', 'Dec Date');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Dec Date_load'), 'Dec Date_load', 'Dec Date_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Contract End Date'), 'Contract End Date_load', 'Contract End Date');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Contract Start Date'), 'Contract Start Date_load', 'Contract Start Date');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Contract End Date_load'), 'Contract End Date_load', 'Contract End Date_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Contract Start Date_load'), 'Contract Start Date_load', 'Contract Start Date_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'TCV_load'), 'TCV_load', 'TCV_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Oppy #_load'), 'Oppy #_load', 'Oppy #_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Sales Stage'), 'Sales Stage_load', 'Sales Stage');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Sales Stage_load'), 'Sales Stage_load', 'Sales Stage_load');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Line Item Owner'), 'Line Item Owner_load', 'Line Item Owner');
      assignActionSupportInfo(line.load, getSourceOfTheField(line, sources, 'Line Item Owner_load'), 'Line Item Owner_load', 'Line Item Owner_load');
      assignActionSupportInfo(line.load, line.account.Attributes, 'Coverage Id_load', 'Coverage_ID');
      if (angular.isUndefined(line.set_1)) {
        line.set_1 = {};
      }
      if (typeof line.action !== 'undefined' && line.action['Cluster Name'] !== '') {
        line.set_1['Cluster Name'] = line.action['Cluster Name'];
      }
      // if (typeof line.action !== 'undefined' && line.action['Action Taskid_load'] !== '') {
      //   line.set_1['Action Taskid_load'] = line.action['Action Taskid_load'];
      // }
      if (angular.isDefined(line.approval) && angular.isDefined(line.approval.Parent) && line.approval.Parent !== null) {
        if (angular.isDefined(line.approval.Parent.Attributes)) {
          line.approval.Parent.buName = line.approval.Parent.Attributes.Caption || line.approval.Parent.Name;
        } else {
          line.approval.Parent.buName = line.approval.Parent.Name;
        }
      }

      if (line.action && angular.isDefined(line.action.Source) && line.action.Source !== '') {
        line.source = line.action.Source;
      }

      if (line.revenueRiskCategory) {
        const hashCode = `${getMapKey(line)}_${line.revenueRiskCategory.Name.replace(' - ', '_').toLowerCase()}`;
        const revData = revenueHashMap[hashCode];
        if (typeof revData !== 'undefined') {
          const riskCat = line.revenueRiskCategory.Name.substring(0, line.revenueRiskCategory.Name.indexOf(' - ')).toLowerCase();
          mergeObjects(line, revData.line);
          line[`${riskCat}CurrentWeek`] = revData.line.CurrentWeek;
          line[`${riskCat}PrevWeek`] = revData.line.PrevWeek;
        }
        // merge FOR UI
        AccountsMergeDataService.mergeRevenueDataOPTIMIZATION(line, '');
        if (angular.isDefined(line.load) && line.load['Contract flag'] !== 1) {
          line.solid1CurrentWeek = {};
          line.solid1PrevWeek = {};
        }
      }
      utilsService.evaluateM1PlusM2AndQtrData(line);
    });

    return data;
  }

  function getSourceOfTheField(line, sources, fieldName) {
    let foundSource = sources[0];
    sources.forEach((element) => {
      if (angular.isDefined(line[element]) && angular.isDefined(line[element][fieldName])) {
        foundSource = element;
      }
    });
    return line[foundSource];
  }

  function mergeObjects(toObj, data) {
    for (const key in data) {
      if (!key.endsWith('_props')) {
        const toData = toObj[key];
        if (typeof toData === 'undefined') {
          toObj[key.replace('commitWeek', 'commitCurrentWeek').replace('bestCanDoWeek', 'bestCanDoCurrentWeek')] = data[key];
        }
      }
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
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true && angular.isDefined(line.roadmapItemType)) {
        return `${line.account.Name}_${line.approval.Name}_${line.serviceLine.Name}_${line.roadmapItemType.Name}`;
      }
      return `${line.account.Name}_${line.approval.Name}_${line.serviceLine.Name}`;
    } else if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
      return `${line.account.Name}_${line.approval.Name}_${line.serviceLine.Name}_${line.roadmapItemType.Name}`;
    }
    return `${line.account.Name}_${line.serviceLine.Name}`;
  }

  // Merge all actions or accounts roadmap data into one structure
  function mergeData(values, riskCategory) {
    const data = values[0];
    const regionName = StaticMappingService.getRegionReadableProp().name;

    // Cognos returns 1 object with empty data for future quarter with no accounts,
    // in such cases return no accounts
    if (data.length === 0) {
      return [];
    }
    if (typeof data[0].account === 'undefined') {
      return [];
    }


    let revenue = values[1];
    if (typeof revenue === 'undefined') {
      revenue = [];
    }
    let previousQuarter = [];
    let previousYear = [];
    let financialGoals = [];
    let ippfData = [];
    if (values.length >= 4 && typeof values[3] !== 'undefined') {
      previousQuarter = values[3];
    }
    if (values.length >= 5 && typeof values[4] !== 'undefined') {
      previousYear = values[4];
    }
    if (CognosService.CognosConfigService.prop.ENABLE_FINANCIAL_GOALS === true) {
      financialGoals = values[values.length - 1]; 
      if (UserSettingsService.isEuGtsRegion()) {
        ippfData = values[values.length - 2];
      }
    } else if (UserSettingsService.isEuGtsRegion()) {
      ippfData = values[values.length - 1];
    }


    const revenueHashMap = retrieveValuesFromSource(revenue);
    delete values[1];
    const previousQuarterRevenueHashMap = retrieveValuesFromSource(previousQuarter);
    const previousYearRevenueHashMap = retrieveValuesFromSource(previousYear);
    const financialGoalsRevenueHashMap = retrieveValuesFromSource(financialGoals);
    const ippfRevenueHashMap = retrieveValuesFromSource(ippfData);


    // merge data to a single array.
    data.forEach((line, index) => {
      if (angular.isUndefined(line.account) || line.account === null) {
        $log.error('Invalid line obj', line);
        data.splice(index, 1);
        return; // Skip this line as it is invalid
      }
      if (angular.isUndefined(line.set_1) || line.set_1 === null) {
        line.set_1 = {};
      }

      if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) { // Do stuff here witch is related to coverage ID
        if (line.set_1 && typeof line.set_1['Business Unit'] !== 'undefined' && line.set_1['Business Unit'] !== '') {
          line.account.Attributes['RR Approval'] = line.set_1['Business Unit'];
        }
        line.account.buName = values[2].map[line.approval.Name].Caption || values[2].map[line.approval.Name].Name;
      } else {
        line.account.buName = values[2].map[line.account.Attributes['RR Approval']].Caption || values[2].map[line.account.Attributes['RR Approval']].Name;
      }

      if (regionName === 'Europe (GTS)' && line.set_1 &&
          typeof line.set_1['Legal Contract Number'] !== 'undefined' && line.set_1['Legal Contract Number'] !== '') {
        line.load['Legal Contract Number_load'] = line.set_1['Legal Contract Number'];
      }

      if (regionName === 'North America (GBS)' && angular.isDefined(line.serviceLine.Parent)) {
        line.serviceLine.slName = line.serviceLine.Parent.Attributes.Caption || line.serviceLine.Parent.Name;
        line.serviceLine.practiceName = line.serviceLine.Attributes.Caption || line.serviceLine.Name;
      }
      assignActionSupportInfo(line.load, line.account.Attributes, 'Coverage Id_load', 'Coverage_ID');
      if (line.set_1 && angular.isDefined(line.set_1.Source) && line.set_1.Source !== '') {
        line.source = line.set_1.Source;
      }
      if (angular.isDefined(line.approval) && angular.isDefined(line.approval.Parent) && line.approval.Parent !== null) {
        if (angular.isDefined(line.approval.Parent.Attributes)) {
          line.approval.Parent.buName = line.approval.Parent.Attributes.Caption || line.approval.Parent.Name;
        } else {
          line.approval.Parent.buName = line.approval.Parent.Name;
        }
      }

      // load.Roadmap Item Type_load
      const hashCode = getMapKey(line);
      const revData = revenueHashMap[hashCode];
      const prevQuarterData = previousQuarterRevenueHashMap[hashCode];
      const prevYearData = previousYearRevenueHashMap[hashCode];
      const financialGoal = financialGoalsRevenueHashMap[hashCode];
      const ippfData = ippfRevenueHashMap[hashCode];
      if (typeof revData !== 'undefined') {
        mergeObjects(line, revData.line);
      }

      if (typeof ippfData !== 'undefined') {
        if (angular.isDefined(ippfData.line) && angular.isDefined(ippfData.line.load)) {
          if (angular.isUndefined(line.action)) {
            line.action = {};
          }
          Object.keys(ippfData.line.load).forEach((key) => line.action[key] = ippfData.line.load[key]);
        }
      }
      const riskCategoryName = (riskCategory === 'Best Can Do') ? 'bestCanDo' : 'commit';
      if (line[`${riskCategoryName}CurrentWeek`]) {
        line.prevQtrPerformance = {
          revenue: line[`${riskCategoryName}CurrentWeek`]['Rev_Roll-over'],
          cost: line[`${riskCategoryName}CurrentWeek`]['Cost_Roll-over'],
          cGPProcents: line[`${riskCategoryName}CurrentWeek`]['cGP%_Roll-over'],
          cGPAmount: { value: 0 },
        };
        if (line.prevQtrPerformance.revenue && line.prevQtrPerformance.cost) {
          line.prevQtrPerformance.cGPAmount.value = Number(line.prevQtrPerformance.revenue.value)
            - Number(line.prevQtrPerformance.cost.value);
          if (typeof line.prevQtrPerformance.cGPProcents === 'undefined') {
            line.prevQtrPerformance.cGPProcents = {};
          }
          line.prevQtrPerformance.cGPProcents.value = utilsService.calculateCGPProcents(
            line.prevQtrPerformance.revenue.value,
            line.prevQtrPerformance.cGPAmount.value);
        }
      }
      utilsService.evaluateM1PlusM2AndQtrData(line);
      if (values.length >= 4) {
        line.previousQuarterValuesBestCanDo = evaluatePreviousPeriodData(line, prevQuarterData, 'bestCanDo');
        line.previousYearValuesBestCanDo = evaluatePreviousPeriodData(line, prevYearData, 'bestCanDo');
        line.previousQuarterValuesCommit = evaluatePreviousPeriodData(line, prevQuarterData, 'commit');
        line.previousYearValuesCommit = evaluatePreviousPeriodData(line, prevYearData, 'commit');
      }
      if (CognosService.CognosConfigService.prop.ENABLE_FINANCIAL_GOALS === true) {
        line.financialGoalBestCanDo = evaluatePreviousPeriodData(line, financialGoal, 'commit', true);
        line.financialGoalDelta = evaluatePreviousPeriodData(line, financialGoal, 'commit');
        // Cost delta should be reversed:
        line.financialGoalDelta.cost.value = 0 - line.financialGoalDelta.cost.value;
      }

      if (line.load && line.load['Roadmap Item Type_load'] !== 'Backlog') {
        line.solid1CurrentWeek = {};
        line.solid1PrevWeek = {};
      }

      // Delete Properties
      delete line.load_props;
      delete line.set_1_props;
    });
    return data;
  }

  function evaluatePreviousPeriodData(line, previousPeriod, riskCategoryName, doNotSubtract) {
    let previousPeriodData = {
      revenue: { value: 0 },
      cost: { value: 0 },
      cGPProcents: { value: 0 },
      cGPAmount: { value: 0 },
    };
    if (angular.isUndefined(previousPeriod) || angular.isUndefined(previousPeriod.line)) {
      return previousPeriodData;
    }
    var previousPeriodLine = previousPeriod.line;
    if (angular.isUndefined(doNotSubtract) && line[`${riskCategoryName}CurrentWeek`] && previousPeriodLine[`${riskCategoryName}CurrentWeek`]) {
      previousPeriodData.revenue.value = subtractTwoElements(line[`${riskCategoryName}CurrentWeek`]['QTR_Rev'], previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_Rev']);
      previousPeriodData.cost.value = subtractTwoElements(line[`${riskCategoryName}CurrentWeek`]['QTR_Cost'], previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_Cost']);
      previousPeriodData.cGPProcents.value = subtractTwoElements(line[`${riskCategoryName}CurrentWeek`]['QTR_cGP_%'], previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_cGP_%']);
      previousPeriodData.cGPProcents.value = previousPeriodData.cGPProcents.value * 100;
      previousPeriodData.cGPAmount.value = subtractTwoElements(line[`${riskCategoryName}CurrentWeek`]['QTR_cGP_$'], previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_cGP_$']);
    } else if (doNotSubtract === true && previousPeriodLine[`${riskCategoryName}CurrentWeek`]) {
      previousPeriodData.revenue.value = getNumberFromElement(previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_Rev']);
      previousPeriodData.cost.value = getNumberFromElement(previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_Cost']);
      previousPeriodData.cGPProcents.value = getNumberFromElement(previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_cGP_%']);
      previousPeriodData.cGPProcents.value = previousPeriodData.cGPProcents.value * 100;
      previousPeriodData.cGPAmount.value = getNumberFromElement(previousPeriodLine[`${riskCategoryName}CurrentWeek`]['QTR_cGP_$']);
    }
    return previousPeriodData;
  }
  function subtractTwoElements(element1, element2) {
    if (angular.isUndefined(element1) || angular.isUndefined(element2)) {
      return 0;
    } else {
      return Number(element1.value) - Number(element2.value);
    }
  }

  function getNumberFromElement(element) {
    return angular.isUndefined(element) || isNaN(element.value) ? 0 : Number(element.value); 
  }

  function retrieveValuesFromSource(revenue) {
    const revenueHashMap = {};
    revenue.forEach((line) => {
      // create a hash map.
      if (line.account != undefined) {
        const hashCode = getMapKey(line);
        revenueHashMap[hashCode] = {
          code: hashCode,
          line,
        };
      }
    });
    return revenueHashMap;
  }

  function preProcessFilterForRevenueData(filter) {
    filter.revenue = {
      riskCategories: [riskCategories.commit, riskCategories.bestCanDo],
      riskCategorySets: [],
      weeks: [weeks.currentWeek, weeks.previousWeek],
    };
    if (filter.week === CognosDimentionService.weeks.RR_INPUT.closingWeek) {
      filter.revenue.weeks = [CognosDimentionService.weeks.RR_INPUT.closingWeek];
    }
    return filter; 
  }

  function getAllRevenueDataOptimization(filter) {
    const deferred = $q.defer();
    filter = preProcessFilterForRevenueData(filter);
    AccountsDataService.getRevenueOptimization(filter).then((data) => {
      deferred.resolve(data);
    }, (err) => {
      if (utilsService.checkMissingAccountsSubsetCase(err, '[RR measures v3].[Roadmap Item Type]')) {
        deferred.resolve([]);
      } else {
        deferred.reject(err);
      }
    }).catch((er) => {
      deferred.reject(er);
    });
    return deferred.promise;
  }

  function mergeRevenueData(data, revenue) {
    if (angular.isUndefined(data)) {
      return [];
    }
    if (data.length === 0) {
      return [];
    }
    if (typeof revenue === 'undefined') {
      revenue = [];
    }

    const revenueHashMap = {};
    revenue.forEach((line) => {
      // create a hash map.
      if (line.account != undefined) {
        const hashCode = getMapKey(line);
        revenueHashMap[hashCode] = {
          code: hashCode,
          line,
        };
      }
    });
    revenue = [];

    // merge data to a single array.
    data.forEach((line, index) => {
      if (line.account == undefined) {
        $log.error('Invalid line obj', line);
        data.splice(index, 1);
        return; // Skip this line as it is invalid
      }

      const hashCode = getMapKey(line);
      const revData = revenueHashMap[hashCode];
      if (typeof revData !== 'undefined') {
        mergeAllObjects(line, revData.line);
      }
      if (line.source === 'Load OPPT' || line.source === 'Manual OPPT'
        || line.source === 'Manual AADJ' || line.source === 'Manual MJDG') {
        line.solid1CurrentWeek = {};
        line.solid1PrevWeek = {};
      }
      // Calculate M1 + M2 and QTR values
      utilsService.evaluateM1PlusM2AndQtrData(line);
    });
  }

  function mergeAllObjects(toObj, data) {
    for (const key in data) {
      if (!key.endsWith('_props') && (key.startsWith('solid') || key.startsWith('risk') || key.startsWith('stretch'))) {
        toObj[key.replace('riskWeek', 'riskCurrentWeek').replace('solidWeek', 'solidCurrentWeek').replace('stretchWeek', 'stretchCurrentWeek')] = data[key];
      }
    }
  }

  function getSolidRiskStretchRevenueData(filter, riskCatSets) {
    const deferred = $q.defer();
    filter.revenue = {
      riskCategories: [],
      riskCategorySets: riskCatSets || [riskCategories.solid, riskCategories.risk,
        riskCategories.stretch, riskCategories.solid1],
      weeks: [weeks.currentWeek, weeks.previousWeek],
    };
    if (filter.week === CognosDimentionService.weeks.RR_INPUT.closingWeek) {
      filter.revenue.weeks = [CognosDimentionService.weeks.RR_INPUT.closingWeek];
    }
    AccountsDataService.getRevenueOptimization(filter).then((revenueData) => {
      deferred.resolve(revenueData);
    }, (err) => {
      if (utilsService.checkMissingAccountsSubsetCase(err, '[RR measures v3].[Roadmap Item Type]')) {
        deferred.resolve([]);
      } else {
        deferred.reject(err);
      }
    }).catch((er) => {
      deferred.reject(er);
    });
    return deferred.promise;
  }

  function getRdmSourceData(filter) {
    const deferred = $q.defer();
    filter.sourceData = {
      setVersion: [versions.loadIPPF, versions.LoadSC, versions.sourceCheck],
      setWeeks: [weeks.currentWeek, weeks.previousWeek],
    };
    if (filter.week === CognosDimentionService.weeks.RR_INPUT.closingWeek) {
      filter.sourceData.setWeeks = [CognosDimentionService.weeks.RR_INPUT.closingWeek];
    }

    AccountsDataService.getRdmSourceData(filter).then((processedData) => {
      deferred.resolve(processedData);
    }, deferred.reject);
    return deferred.promise;
  }

  function getAllSourceDataForExport(filter) {
    const deferred = $q.defer();
    const filterObject = angular.copy(filter);
    filterObject.sourceData = {
      setVersion: [versions.loadIPPF, versions.LoadSC, versions.sourceCheck],
      setWeeks: [weeks.currentWeek, weeks.previousWeek],
      riskCategories: [riskCategories.commit, riskCategories.bestCanDo],
    };
    if (filter.week === CognosDimentionService.weeks.RR_INPUT.closingWeek) {
      filterObject.sourceData.setWeeks = [CognosDimentionService.weeks.RR_INPUT.closingWeek];
    }

    AccountsDataService.getSourceData(filterObject).then((processedData) => {
      deferred.resolve(processedData);
    }, deferred.reject);
    return deferred.promise;
  }

  function getAllSourceDataForAllRiskCategories(filter) {
    const deferred = $q.defer();
    const filterObject = angular.copy(filter);
    filterObject.sourceData = {
      setVersion: [versions.loadIPPF, versions.LoadSC, versions.sourceCheck],
      setWeeks: [weeks.currentWeek, weeks.previousWeek],
      riskCategories: [riskCategories.commit, riskCategories.bestCanDo,
      riskCategories.solid, riskCategories.risk, riskCategories.stretch],
    };
    if (filter.week === CognosDimentionService.weeks.RR_INPUT.closingWeek) {
      filterObject.sourceData.setWeeks = [CognosDimentionService.weeks.RR_INPUT.closingWeek];
    }

    for (let i = 1; i <= 10; i += 1) {
      filterObject.sourceData.riskCategories.push(`Solid - ${i}`);
      filterObject.sourceData.riskCategories.push(`Risk - ${i}`);
      filterObject.sourceData.riskCategories.push(`Stretch - ${i}`);
    }
    AccountsDataService.getSourceData(filterObject).then((processedData) => {
      deferred.resolve(processedData);
    }, deferred.reject);
    return deferred.promise;
  }

  function getSingleOpportunityInfo(filter) {
    console.log('start getSingleOpportunityInfo');
    const deferred = $q.defer();
    const filterObject = angular.copy(filter);
    filterObject.riskCategory = riskCategories.solid1;
    AccountsDataService.getSingleOpportunityInfo(filterObject).then((processedData) => {
      deferred.resolve(processedData);
    }, deferred.reject);
    return deferred.promise;
  }

  function getAllAccountAdjustments(filter, account, refresh) {
    return $q((resolve, reject) => {
      filter.account = account.toUpperCase();
      const calls = [
        getAccountAdjustments(filter, undefined, refresh),
        getAccountAdjustments(filter, 'Best Can Do', refresh),
        getAccountAdjustments(filter, 'Stretch', refresh),
      ];
      $q.all(calls).then((values) => {
        const accountAdjustment = {
          backlog: {},
          signings: {},
          totals: {},
        };
        const commitData = AccountsMergeDataService.mergeAccountAdjustments(values[0]);
        const bestCanDoData = AccountsMergeDataService.mergeAccountAdjustments(values[1], 'Best Can Do');
        const stretchData = AccountsMergeDataService.mergeAccountAdjustments(values[2], 'Stretch');
        accountAdjustment.commit = commitData.commit;
        accountAdjustment.bestCanDo = bestCanDoData.bestCanDo;
        accountAdjustment.bestCanDo.stretch = stretchData.stretch.totals;
        accountAdjustment.bestCanDo.signings = stretchData.stretch.signings;
        accountAdjustment.bestCanDo.backlog = stretchData.stretch.backlog;

        // Add displayValue for dates
        accountAdjustment.commit.backlog.accountExpected.action.dueDate.displayValue =
          accountAdjustment.commit.backlog.accountExpected.action.dueDate.value === 0 ? null :
            new Date(utilsService.formatDateFromCognos(accountAdjustment.commit.backlog.accountExpected.action.dueDate.value));

        accountAdjustment.commit.signings.accountExpected.action.dueDate.displayValue =
          accountAdjustment.commit.signings.accountExpected.action.dueDate.value === 0 ? null :
            new Date(utilsService.formatDateFromCognos(accountAdjustment.commit.signings.accountExpected.action.dueDate.value));

        accountAdjustment.bestCanDo.backlog.accountExpected.action.dueDate.displayValue =
          accountAdjustment.bestCanDo.backlog.accountExpected.action.dueDate.value === 0 ? null :
            new Date(utilsService.formatDateFromCognos(accountAdjustment.bestCanDo.backlog.accountExpected.action.dueDate.value));

        accountAdjustment.bestCanDo.signings.accountExpected.action.dueDate.displayValue =
          accountAdjustment.bestCanDo.signings.accountExpected.action.dueDate.value === 0 ? null :
            new Date(utilsService.formatDateFromCognos(accountAdjustment.bestCanDo.signings.accountExpected.action.dueDate.value));

        resolve(accountAdjustment);
      }, (err) => {
        console.error(err);
        ErrorService.handleError(err);
      });
    });
  }

  function getAccountAdjustments(filterObject, riskCategoryType, refresh) {
    let riskCategoryObject = {
      backlogAccountExpectedRiskCategory: 'Risk-1',
      backlogOWRiskCategory: 'Risk',
      backlogAdjustmentAppliedRiskCategory: riskCategories.commit,
      backlogRoadmapRiskCategory: riskCategories.commit,

      signingsAccountExpectedRiskCategory: 'Risk-1',
      signingsOWRiskCategory: 'Risk',
      signingsAdjustmentAppliedRiskCategory: riskCategories.commit,
      signingsRoadmapRiskCategory: riskCategories.commit,
      totals: riskCategories.commit,
    };
    if (riskCategoryType === 'Best Can Do') {
      riskCategoryObject = {
        backlogAccountExpectedRiskCategory: riskCategories.bestCanDo,
        backlogAdjustmentAppliedRiskCategory: riskCategories.bestCanDo,
        backlogRoadmapRiskCategory: riskCategories.bestCanDo,

        signingsAccountExpectedRiskCategory: riskCategories.bestCanDo,
        signingsAdjustmentAppliedRiskCategory: riskCategories.bestCanDo,
        signingsRoadmapRiskCategory: riskCategories.bestCanDo,
        totals: riskCategories.bestCanDo,
        totalsStretch: riskCategories.bestCanDo,
      };
    }
    if (riskCategoryType === 'Stretch') {
      riskCategoryObject = {
        backlogAccountExpectedRiskCategory: 'Stretch-1',
        backlogAdjustmentAppliedRiskCategory: 'Stretch',
        backlogRoadmapRiskCategory: 'Stretch',

        signingsAccountExpectedRiskCategory: 'Stretch-1',
        signingsAdjustmentAppliedRiskCategory: 'Stretch',
        signingsRoadmapRiskCategory: 'Stretch',
        totals: 'Stretch',
        totalsStretch: 'Stretch',
      };
    }
    return $q((resolve, reject) => {
      const locals = {};
      asyncService.parallel([
        //  Get information for totals
        (callback) => {
          // Get Account expected data
          const filter = angular.copy(filterObject);
          filter.serviceLine = 'Rdmp Service Lines';
          filter.riskCategory = riskCategoryObject.totals;
          getAccountAdjustmentsCached(angular.copy(filter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.commitAccountExpected = processedData.data;
            callback();
          }, refresh);
        },
        // Get w/w
        (callback) => {
          const wwFilter = angular.copy(filterObject);
          wwFilter.week = 'Delta to prev Wk';
          wwFilter.serviceLine = 'Rdmp Service Lines';
          wwFilter.riskCategory = riskCategoryObject.totals;
          getAccountAdjustmentsCached(angular.copy(wwFilter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.commitWW = processedData.data;
            callback();
          }, refresh);
        },
        (callback) => {
          const aadjFilter = angular.copy(filterObject);
          aadjFilter.week = weeks.currentWeek;
          aadjFilter.serviceLine = 'AADJ';
          aadjFilter.account = `Account Adjustment Backlog - ${aadjFilter.account}`;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            aadjFilter.roadmapItemType = 'Other';
          }
          aadjFilter.riskCategory = riskCategoryObject.totals;
          getAccountAdjustmentsCached(angular.copy(aadjFilter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.commitBacklogAdjustmentAplied = processedData.data;
            callback();
          }, refresh);
        },
        (callback) => {
          const aadjFilter = angular.copy(filterObject);
          aadjFilter.week = weeks.currentWeek;
          aadjFilter.serviceLine = 'AADJ';
          aadjFilter.account = `Account Adjustment Sign Yield - ${aadjFilter.account}`;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            aadjFilter.roadmapItemType = 'Other';
          }

          aadjFilter.riskCategory = riskCategoryObject.totals;
          getAccountAdjustmentsCached(angular.copy(aadjFilter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.commmitSignYieldAdjustmentAplied = processedData.data;
            callback();
          }, refresh);
        },

        // Bacjlog Yield Commit

        (callback) => {
          // Get Account expected data
          const filter = angular.copy(filterObject);
          filter.riskCategory = riskCategoryObject.backlogAccountExpectedRiskCategory;// 'Risk-1';
          filter.serviceLine = 'All Service Lines';
          filter.account = `Account Expected Backlog - ${filter.account}`;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            filter.roadmapItemType = 'Other';
          }
          getAccountAdjustmentsCached(angular.copy(filter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.backlogCommitAccountExpected = processedData.data;
            locals.backlogCommitAccountExpected[0].account = filter.account;
            locals.backlogCommitAccountExpected[0].riskCategory = filter.riskCategory;
            callback();
          }, refresh);
        },

        // Get o/w Risk
        (callback) => {
          if (riskCategoryObject.backlogOWRiskCategory) {
            const filter = angular.copy(filterObject);
            filter.week = weeks.currentWeek;
            filter.riskCategory = riskCategoryObject.backlogOWRiskCategory;
            filter.serviceLine = 'Rdmp Service Lines';
            getAccountAdjustmentsCached(angular.copy(filter), (err, data) => {
              if (err) callback(err);
              const processedData = CognosResponseService.processJSON(data);
              locals.backlogCommitOWRisk = processedData.data;
              callback();
            }, refresh);
          } else {
            callback();
          }
        },
        // Get Adjustment applied
        (callback) => {
          const aadjFilter = angular.copy(filterObject);
          aadjFilter.week = weeks.currentWeek;
          aadjFilter.serviceLine = 'AADJ';
          aadjFilter.riskCategory = riskCategoryObject.backlogAdjustmentAppliedRiskCategory;
          aadjFilter.account = `Account Adjustment Backlog - ${aadjFilter.account}`;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            aadjFilter.roadmapItemType = 'Other';
          }
          getAccountAdjustmentsCached(angular.copy(aadjFilter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.backlogCommitBacklogAdjustmentAplied = processedData.data;
            callback();
          }, refresh);
        },
        // Get Roadmap
        (callback) => {
          const backlogRdmpFilter = angular.copy(filterObject);
          backlogRdmpFilter.week = weeks.currentWeek;
          backlogRdmpFilter.serviceLine = 'Rdmp Service Lines';
          backlogRdmpFilter.riskCategory = riskCategoryObject.backlogRoadmapRiskCategory;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            backlogRdmpFilter.roadmapItemType = 'Backlog';
          }
          getAccountAdjustmentsCached(angular.copy(backlogRdmpFilter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.backlogCommmitSignYieldRoadmap = processedData.data;
            callback();
          }, refresh);
        },

        // Signinsg Yield Commit

        (callback) => {
          // Get Account expected data
          const filter = angular.copy(filterObject);
          filter.riskCategory = riskCategoryObject.signingsAccountExpectedRiskCategory;// 'Risk-1';
          filter.week = weeks.currentWeek;
          filter.serviceLine = 'All Service Lines';
          filter.account = `Account Expected Sign Yield -${filter.account}`;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            filter.roadmapItemType = 'Other';
          }
          getAccountAdjustmentsCached(angular.copy(filter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.signingsCommitAccountExpected = processedData.data;
            locals.signingsCommitAccountExpected[0].account = filter.account;
            locals.signingsCommitAccountExpected[0].riskCategory = filter.riskCategory;
            callback();
          }, refresh);
        },
        // Get o/w Risk
        (callback) => {
          if (riskCategoryObject.signingsOWRiskCategory) {
            const filter = angular.copy(filterObject);
            filter.riskCategory = riskCategoryObject.signingsOWRiskCategory;
            filter.serviceLine = 'Rdmp Service Lines';
            getAccountAdjustmentsCached(angular.copy(filter), (err, data) => {
              if (err) callback(err);
              const processedData = CognosResponseService.processJSON(data);
              locals.signingsCommitOWRisk = processedData.data;
              callback();
            }, refresh);
          } else {
            callback();
          }
        },
        // Get Adjustment applied
        (callback) => {
          const aadjFilter = angular.copy(filterObject);
          aadjFilter.week = weeks.currentWeek;
          aadjFilter.serviceLine = 'AADJ';
          aadjFilter.riskCategory = riskCategoryObject.signingsAdjustmentAppliedRiskCategory;
          aadjFilter.account = `Account Adjustment Sign Yield -${aadjFilter.account}`;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            aadjFilter.roadmapItemType = 'Other';
          }
          getAccountAdjustmentsCached(angular.copy(aadjFilter), (err, data) => {
            if (err || !data) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.signingsCommitBacklogAdjustmentAplied = processedData.data;
            callback();
          }, refresh);
        },
        // Get Roadmap
        (callback) => {
          const aadjFilter = angular.copy(filterObject);
          aadjFilter.week = weeks.currentWeek;
          aadjFilter.serviceLine = 'Rdmp Service Lines';
          aadjFilter.riskCategory = riskCategoryObject.signingsRoadmapRiskCategory;
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            aadjFilter.roadmapItemType = 'In Quarter';
          }
          getAccountAdjustmentsCached(angular.copy(aadjFilter), (err, data) => {
            if (err) callback(err);
            const processedData = CognosResponseService.processJSON(data);
            locals.signingsCommmitSignYieldRoadmap = processedData.data;
            callback();
          }, refresh);
        },
        (callback) => {
          if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
            const filter = angular.copy(filterObject);
            filter.riskCategory = riskCategoryObject.backlogAccountExpectedRiskCategory;// 'Risk-1';
            filter.serviceLine = 'All Service Lines';
            filter.account = `Account Expected Sign Yield - ${filter.account}`;
            if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
              filter.roadmapItemType = 'Other';
            }
            getAccountAdjustmentsCached(angular.copy(filter), (err, data) => {
              if (err) callback(err);
              const processedData = CognosResponseService.processJSON(data);
              locals.signYieldExpected = processedData.data;
              callback();
            }, refresh);
          } else {
            callback();
          }
        },
      ], (err) => {
        if (err) return reject(err);
        resolve(locals);
      });
      // }
    });
  }

  function getAccountAdjustmentsCached(filter, callback, refresh) {
    const key = ibpCache.getAccountAdjustmentDataCacheKey(filter);
    const dataFromCache = ibpCache.accountAdjustmentDataCache.get(key);
    if (cacheEnabled || refresh || dataFromCache === undefined) {
      AccountsDataService.getAccountAdjustments(filter, (err, data) => {
        // ibpCache.accountAdjustmentDataCache.put(key, data);
        callback(err, data);
      });
    } else {
      callback(null, dataFromCache);
    }
  }

  busService.defaultChannel.subscribe(busService.events.ROADMAP_ADJUSTMENT_UPDATED, null, (eventData, envelope) => {
    $log.info('BusService >>> AccountsCachedDataService >>> RoadmapAdjustmentUpdatedHandler:', eventData, envelope);
    invalidateAccountsDataCache(eventData.filter, envelope);
    $log.info('BusService >>> AccountsCachedDataService >>> RoadmapAdjustmentUpdatedHandler: DONE.');

    function invalidateAccountsDataCache(filter, parentEvent) {
      const accountCacheInvalidation = ibpCache.invalidateCacheByCriteria(filter, ibpCache.accountDataCache, matchCacheKey);
      const revenueCacheInvalidation = ibpCache.invalidateCacheByCriteria(filter, ibpCache.revenueDataCache, matchCacheKey);
      accountCacheInvalidation.parentEvent = parentEvent;
      revenueCacheInvalidation.parentEvent = parentEvent;
      return [accountCacheInvalidation, revenueCacheInvalidation];

      function matchCacheKey(key, filter) {
        if (key.node === filter.node) {
          return true;
        }
        return false;
      }
    }
  });

  busService.defaultChannel.subscribe(busService.events.NODE_LOCKED, null, (eventData, envelope) => {
    $log.info('BusService >>> AccountsCachedDataService >>> NodeLockedHandler:', eventData, envelope);
    // TODO probably need to invalidate all account cache related with finantial data, because if node is not locked it can be changed by other person

    $log.info('BusService >>> AccountsCachedDataService >>> NodeLockedHandler: DONE.');
  });


  busService.defaultChannel.subscribe(busService.events.NODE_UNLOCKED, null, (eventData, envelope) => {
    $log.info('BusService >>> AccountsCachedDataService >>> NodeUnlockedHandler:', eventData, envelope);
    invalidateAccountDetailsCacheBySandbox(eventData.sandbox, envelope);
    $log.info('BusService >>> AccountsCachedDataService >>> NodeUnlockedHandler: DONE.');
  });

  busService.defaultChannel.subscribe(busService.events.SANDBOX_PUBLISHED, null, (eventData, envelope) => {
    $log.info('BusService >>> AccountsCachedDataService >>> SandboxPublishedHandler:', eventData, envelope);
    invalidateAccountDetailsCacheBySandbox(eventData.sandbox, envelope);
    $log.info('BusService >>> AccountsCachedDataService >>> SandboxPublishedHandler: DONE.');
  });

  busService.defaultChannel.subscribe(busService.events.SANDBOX_DISCARDED, null, (eventData, envelope) => {
    $log.info('BusService >>> AccountsCachedDataService >>> SandboxDiscardedHandler:', eventData, envelope);
    invalidateAccountDetailsCacheBySandbox(eventData.sandbox, envelope);
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    ibpCache.revenueDataCache.removeAll();
    $log.info('BusService >>> AccountsCachedDataService >>> SandboxDiscardedHandler: DONE.');
  });

  function invalidateAccountDetailsCacheBySandbox(sandbox, parentEvent) {
    let invalidationResults = invalidateAccountDetailsCacheBySandboxAndCache(sandbox, ibpCache.accountCommitDetailsDataCache);
    if (invalidationResults.keys.length > 0) {
      const invalidationEvent = {
        keys: invalidationResults.keys,
        keyObjects: invalidationResults.keyObjects,
        parentEvent,
      };
      busService.cacheChannel.publish(busService.events.ACCOUNT_DETAILS_COMMIT_DATA_CACHE_INVALIDATED, invalidationEvent);
    }
    invalidationResults = invalidateAccountDetailsCacheBySandboxAndCache(sandbox, ibpCache.accountBestCanDoDetailsDataCache);
    if (invalidationResults.keys.length > 0) {
      const invalidationEvent1 = {
        keys: invalidationResults.keys,
        keyObjects: invalidationResults.keyObjects,
        parentEvent,
      };
      busService.cacheChannel.publish(busService.events.ACCOUNT_DETAILS_BEST_CAN_DO_DATA_CACHE_INVALIDATED, invalidationEvent1);
    }
  }

  function invalidateAccountDetailsCacheBySandboxAndCache(sandbox, cache) {
    const cacheKeys = cache.keys();
    const keys = [];
    const keyObjects = [];
    cacheKeys.forEach((key) => {
      let keyObject;
      try {
        keyObject = JSON.parse(key);
      } catch (error) {
        throw new Error(`JSON.parse error at acc cached data service: ${error.message}`);
      }
      if (keyObject.sandbox === sandbox) {
        $log.info('Remove cache element - ', key);
        keys.push(key);
        keyObjects.push(keyObject);
        cache.remove(key);
      }
    });
    return {
      keys,
      keyObjects,
    };
  }
}
