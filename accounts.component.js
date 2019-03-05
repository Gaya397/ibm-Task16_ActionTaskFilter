const angular = require('angular');

function AccountsController($scope, $window, $log, $q, $stateParams, $timeout, AccountsUIService,
  utilsService, uiGridConstants, ibpCache, SandboxService, AccountsCachedDataService,
  $uibModal, busService, fullScreenSpinner, asyncService, ErrorService, CognosDimentionService,
  StaticMappingService, FilterService, AccountsMergeDataService, AccountsAggregateService,
  $rootScope, UserSettingsService, CognosService, NodesHierarchyCachedDataService,
  CsvExportService, RestoreSourceDataService, AccountsEditService, itemAdjustmentModalService,
  $state, ExportSettingsService, CognosConfigService, cadenceService, BusinessUnitCardDataService,
  ClearActionsModalService, roadmapCommon) {
  // XXX: Would be nice to move this to some central location so other components can access it too
  const roadmapGridSizeCacheKey = 'roadmap-grid-size';
  $scope.serviceLineFilterMap = {};

  const timeYears = CognosDimentionService.timeYears.RR_INPUT;
  const timeQuarters = CognosDimentionService.timeQuarters.RR_INPUT;
  $scope.isReadOnly = CognosService.CognosConfigService.prop.readOnly;
  const additionalFields = AccountsUIService.getAdditionalFields();

  let rootNode = null;
  if (typeof StaticMappingService.getRegionReadableProp() !== 'undefined') {
    rootNode = StaticMappingService.getRegionReadableProp().name;
  }
  const currentNodeName = utilsService.getEscapedNodeName($stateParams.unit);
  const $ctrl = this;
  $ctrl.animationsEnabled = true;
  $ctrl.region = UserSettingsService.getRegion();

  this.$onInit = () => {
    // init stuff here
  };
  $scope.travelCost = { Flag: false };
  let travelCostFlagFilter = $scope.travelCost.Flag;
  $scope.TRAVEL_COST = CognosService.CognosConfigService.prop.TRAVEL_COST;

  $rootScope.displayDateFormat = CognosService.CognosConfigService.prop.DISPLAY_DATE_FORMAT || 'yyyy-MM-dd';

  $scope.myData = [];

  NodesHierarchyCachedDataService.getNodeByNodeName(currentNodeName).then((nodeData) => {
    $scope.nodeData = nodeData;
    $scope.nodeData.lowest = typeof nodeData.lowest === 'undefined' ? false : nodeData.lowest;
  });

  let roadmapType = $state.current.name === 'roadmap.actions' ? 'actions' : $stateParams.roadmapType;
  if (typeof roadmapType === 'undefined') {
    roadmapType = 'accounts';
  }
  $scope.roadmapType = roadmapType;
  
  $scope.isFilterAplied = false;

  
  $scope.isEuGtsRegion = () => {
    return UserSettingsService.isEuGtsRegion();
  }

  $scope.isEuGbsRegion = () => {
    return UserSettingsService === 'EU';
  }
  
    $scope.resetFilter = () => {
    if ($stateParams.accName) {
      $state.go('.', { unit: $stateParams.unit }, { reload: true, inherit: false });
      return;
    }

    $scope.travelCost.Flag = false;
    const defaultValues = [{
      name: 'All',
      value: '',
    }];
    $scope.accountNameFilterOptionsOut = angular.copy(defaultValues);
    $scope.roadmapTypeOptionsOut = angular.copy(defaultValues);
    $scope.serviceLineFilterOptionsOut = angular.copy(defaultValues);
    $scope.industryFilterOptionsOut = angular.copy(defaultValues);
    $scope.countryFilterOptionsOut = angular.copy(defaultValues);
    $scope.legalNumberFilter = angular.copy(defaultValues);
    $scope.descriptionFilter = {
      name: 'All',
      value: '',
    };
    $scope.contractNumberFilterOptionsOut = angular.copy(defaultValues);
    $scope.affiliatesFilter = {
      name: 'All',
      value: '',
    };
   
    $scope.salesStatusFilterOptionsOut = angular.copy(defaultValues);
    $scope.scStatusFilterOptionsOut = angular.copy(defaultValues);
    $scope.actionTaskIdFilterOptionsOut = angular.copy(defaultValues);
    $scope.sourceFilterOptionsOut = angular.copy(defaultValues);
    $scope.clusterNameFilterOptionsOut = angular.copy(defaultValues);
    $scope.practiceNameFilterOptionsOut = angular.copy(defaultValues);
    $scope.legalNumberFilterOptionsOut = angular.copy(defaultValues);
    $scope.ragFilterOptionsOut = angular.copy(defaultValues);
    $scope.revenueRiskCategoryFilterOptionsOut = angular.copy(defaultValues);
    $scope.cognitiveRankFilterOptionsOut = angular.copy(defaultValues);
    $scope.cognitiveRankReasoningFilterOptionsOut = angular.copy(defaultValues);
    $scope.contractWithClaimFlag = false;
    $scope.actionWithCommentFlag = false;
    $scope.applyFilter();
    $scope.filtersOpen = false;
    $scope.isFilterAplied = false;
  };

  function resetAllFilters() {
    $scope.gridApi.core.clearAllFilters(false);
  }

  function refreshUIGridAfterFiltering() {
    $scope.filtersOpen = false;

    $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
    $timeout(() => {
      AccountsUIService.updateUIGridHeight($scope);
    }, 100);
  }

  function processFilteringForSL(column) {
    let filters = [];

    $scope.serviceLineFilterOptionsOut.forEach((i) => {
      if (i.name === 'All') {
        filters = [];
        return;
      }
      $scope.serviceLineFilterMap[i.name] = 1;
      filters.push(i.name);
    });
    column.filters[0].term = filters.join(', ');
    column.filters[0].condition = new RegExp(filters.join('|'));
  }

  const filterState = {};
  $scope.manageFilterState = (action) => {
    const filters = ['accountNameFilterOptionsOut', 'roadmapTypeOptionsOut', 'serviceLineFilterOptionsOut',
      'industryFilterOptionsOut', 'legalNumberFilter', 'contractNumberFilterOptionsOut',
      'salesStatusFilterOptionsOut', 'scStatusFilterOptionsOut', 'sourceFilterOptionsOut', 'clusterNameFilterOptionsOut',
      'legalNumberFilterOptionsOut', 'ragFilterOptionsOut', 'revenueRiskCategoryFilterOptionsOut',
      'affiliatesFilter', 'practiceNameFilterOptionsOut', 'cognitiveRankFilterOptionsOut', 'cognitiveRankReasoningFilterOptionsOut', 'contractWithClaimFlag', 
      'actionWithCommentFlag', 'countryFilterOptionsOut','actionTaskIdFilterOptionsOut',
    ];

    if (action === 'save') {
      filters.forEach((filter) => {
        filterState[filter] = angular.copy($scope[filter]);
      });
    } else if (action === 'restore') {
      filters.forEach((filter) => {
        $scope[filter] = angular.copy(filterState[filter]);
      });
    }
  };

  let isInServiceLine = false;
  $scope.applyFilter = () => {
    fullScreenSpinner.show();
    if (travelCostFlagFilter !== $scope.travelCost.Flag) {
      travelCostFlagFilter = $scope.travelCost.Flag;
      $log.info('Travel Cost Flag has changed we need to reaload data.');
      allInfoFunction(true, getFilter()).then((data) => {
        AccountsCachedDataService.getSolidRiskStretchRevenueData(getFilter()).then((data1) => {
          AccountsCachedDataService.mergeRevenueData(data, data1);
          $scope.commitData = data;
          $scope.myData = data;
          removeSolid1($scope.myData);
          if (data.length === 0) {
            $scope.loadingText = 'No Records Found';
          }
          refreshUIGridAfterFiltering();
          fullScreenSpinner.hide();
        });
      }, ErrorService.handleError);
      $scope.isFilterAplied = false;
      /* XXX: Code below hides spinner multiple times even though code above
      has not finished working. */
    }
    $scope.gridApi.grid.columns.forEach((column) => {
      if (column.name === AccountsUIService.accountName.name
        && $scope.accountNameFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.accountNameFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.roadmapItemType.name
        && $scope.roadmapTypeOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.roadmapTypeOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.serviceLine.name) { // Process SL filter in here.
        if ($scope.serviceLineFilterOptionsOut) {
          if ($scope.serviceLineFilterOptionsOut[0]
            && $scope.serviceLineFilterOptionsOut[0].special) {
            fullScreenSpinner.show();
            const filter = getFilter();
            filter.serviceLine = serviceLines.totalServiceLines;
            allInfoFunction(true, filter).then((data) => {
              $scope.commitData = data;
              $scope.myData = data;
              removeSolid1($scope.myData);
              if (data.length === 0) {
                $scope.loadingText = 'No Records Found';
              }
              if (angular.isDefined($scope.solidRiskDataSelected)) {
                $scope.solidRiskDataSelected = false;
                busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, filter);
              }
              if (angular.isDefined($scope.solid1StretchDataSelected)) {
                $scope.solid1StretchDataSelected = false;
                busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, filter);
              }
              refreshUIGridAfterFiltering();
              column.filters[0].term = undefined;
              column.filters[0].condition = undefined;
              column.filters[0].noTerm = false;
              fullScreenSpinner.hide();
              isInServiceLine = true;
            }, ErrorService.handleError);
          } else if ($scope.serviceLineFilterOptionsOut[0]
            && $scope.serviceLineFilterOptionsOut[0].load) {
            fullScreenSpinner.show();
            const filterObject = getFilter();
            filterObject.serviceLine = serviceLines.servicesList;
            allInfoFunction(true, filterObject).then((data) => {
              $scope.commitData = data;
              $scope.myData = data;
              removeSolid1($scope.myData);
              if (data.length === 0) {
                $scope.loadingText = 'No Records Found';
              }
              refreshUIGridAfterFiltering();
              processFilteringForSL(column);
              fullScreenSpinner.hide();
              isInServiceLine = true;
            }, ErrorService.handleError);
            if (angular.isDefined($scope.solidRiskDataSelected)) {
              $scope.solidRiskDataSelected = false;
              busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, filterObject);
            }
            if (angular.isDefined($scope.solid1StretchDataSelected)) {
              $scope.solid1StretchDataSelected = false;
              busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, filterObject);
            }
          } else {
            if (isInServiceLine) {
              reloadDataAfterSomeChange(true, false, false).then(() => {
                isInServiceLine = false;
              }, (err) => {
                ErrorService.handleError(err);
              });
            }
            processFilteringForSL(column);
          }
          $scope.isFilterAplied = true;
        } else if ($scope.serviceLineFilterOptions
          && $scope.serviceLineFilterOptions.length === 1 && $scope.serviceLineFilter === null) {
          reloadDataAfterSomeChange(true, true);
        }
      } else if (column.name === AccountsUIService.projectIndustry.name
        && $scope.industryFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.industryFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.projectCountry.name
        && $scope.countryFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.countryFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.legalNumber.name
        && $scope.legalNumberFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.legalNumberFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.contractNumber.name
        && $scope.contractNumberFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.contractNumberFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.projectSaleStatus.name
        && $scope.salesStatusFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.salesStatusFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.roadmapStatus.name
        && $scope.scStatusFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.scStatusFilterOptionsOut);
        $scope.isFilterAplied = true;

      // } else if (column.name === AccountsUIService.ActionTaskid.name
      //   && $scope.actionTaskIdFilterOptionsOut) {
      //   utilsService.processMultiSelectFiltering(column, $scope.actionTaskIdFilterOptionsOut);
      //   $scope.isFilterAplied = true;


      } else if (column.name === AccountsUIService.ActionTaskid.name
        && $scope.actionTaskIdFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.actionTaskIdFilterOptionsOut);
        $scope.isFilterAplied = true;


      } else if (column.name === AccountsUIService.source.name
        && $scope.sourceFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.sourceFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.affiliates.name && typeof $scope.affiliatesFilter !== 'undefined') {
        column.filters[0].term = $scope.affiliatesFilter.value;
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.clusterName.name
        && $scope.clusterNameFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.clusterNameFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.cognitiveRank.name
        && $scope.cognitiveRankFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.cognitiveRankFilterOptionsOut);
        if (column.filters[0].term) {
          column.filters[0].noTerm = true;
          column.filters[0].condition = conditionFunctionForCognitiveInformation;
        }
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.cognitiveRankReasoning.name
        && $scope.cognitiveRankReasoningFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.cognitiveRankReasoningFilterOptionsOut);
        if (column.filters[0].term) {
          column.filters[0].noTerm = true;
          column.filters[0].condition = conditionFunctionForCognitiveInformation;
        }
        $scope.isFilterAplied = true;
        } else if (column.name === AccountsUIService.RAG.name
        && $scope.ragFilterOptionsOut) {
        utilsService.processMultiSelectFiltering(column, $scope.ragFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.RevenueRiskCategory.name
        && $scope.revenueRiskCategoryFilterOptionsOut) {
        $scope.isFilterAplied = true;
        utilsService.processMultiSelectFiltering(column,
          $scope.revenueRiskCategoryFilterOptionsOut);
        $scope.isFilterAplied = true;
      } else if (column.name === AccountsUIService.practise.name
        && $scope.practiceNameFilterOptionsOut) {
        $scope.isFilterAplied = true;
        utilsService.processMultiSelectFiltering(column, $scope.practiceNameFilterOptionsOut);
      } else if (column.name === AccountsUIService.cognitiveClaimFlagReasoning.name) {
        if ($scope.contractWithClaimFlag) {
          $scope.isFilterAplied = true;
          column.filters[0].noTerm = true;
          column.filters[0].condition = (searchTerm, cellValue) => {return !(!cellValue || 0 === cellValue.length)};
        } else {
          column.filters[0].noTerm = false;
          column.filters[0].term = undefined;
          column.filters[0].condition = undefined;
        }
      } 
      else if (column.name === AccountsUIService.Comment.name) {
        if ($scope.actionWithCommentFlag === true) {
          $scope.isFilterAplied = true;
          column.filters[0].noTerm = true;
          column.filters[0].condition = (searchTerm, cellValue) => {return !(!cellValue || 0 === cellValue.length)};
        } else {
          column.filters[0].noTerm = false;
          column.filters[0].term = undefined;
          column.filters[0].condition = undefined;
        }
      }
    });
    refreshUIGridAfterFiltering();
  };

  let conditionFunctionForCognitiveInformation = (searchTerm, cellValue) => {
    let valueToBeReturned = false;
    if (searchTerm) {
      const searchTermTokens = searchTerm.replace(/\^|\$|\\/g, '').trim().split(',');
      const cellValueWithoutNumbers = typeof cellValue === 'undefined' ? undefined: cellValue.replace(/\d+|%/g, '');
      searchTermTokens.forEach((searchTermToken) => {
        if (searchTermToken === 'None') {
          if (typeof cellValueWithoutNumbers === 'undefined' || cellValueWithoutNumbers.trim() === '') {
            valueToBeReturned = true;
          }
        } else if (typeof cellValueWithoutNumbers !== 'undefined' && cellValueWithoutNumbers.indexOf(searchTermToken.trim()) !== -1) {
          valueToBeReturned = true;
        }
      });
    }
    return valueToBeReturned;
  };

  $scope.changeView = (callback, doRestoreUIGrid) => {
    //! test if user have updated View Level.
    if ($scope.selectedView !== $scope.selectedView_Prev) {
      $scope.selectedView_Prev = $scope.selectedView;
      const t1 = performance.now();
      reloadDataAfterSomeChange(false, false, true, doRestoreUIGrid).then(() => {
        if (callback) {
          $log.info('Time taken to get and merge commit and bcd data:');
          $log.info((performance.now() - t1) / 1000);
          callback();
        } else {
          ErrorService.handleError();
        }
      },
      );
    }
  };

  $scope.isSelectableRoadmap = () => {
    return !(angular.isDefined($state.current) &&  $state.current.name === 'roadmap.actions');
  };

  $scope.isAccountDefined = (row) => {
    return angular.isDefined(getAccountName(row));
  };

  $scope.isAccountViewableOrEditable = () => {
    return angular.isDefined($scope.lockInfo) && angular.isDefined($scope.lockInfo.sandbox);
  };

  $scope.getAccountCellTitle = () => {
    if (angular.isDefined($state.current) &&  $state.current.name === 'roadmap.accounts') {
      return 'Click to view account details';
    } else if (angular.isDefined($state.current) && $state.current.name === 'roadmap.contracts') {
      return 'Click to view contract details';
    } else if (angular.isDefined($state.current) && $state.current.name === 'roadmap.actions') {
      return 'Click to view contract details';
    }
    return '';
  };

  const serviceLines = CognosDimentionService.serviceLines.RR_INPUT;

  function allInfoFunction(refresh, filter) {
    if (typeof filter === 'undefined') {
      filter = getFilter();
    }
    if ($state.current.name === 'roadmap.actions') {
      // Get actions roadmap accounts
      return AccountsCachedDataService.getAllActionsInfoWithFilter(filter, refresh);
    }
    return AccountsCachedDataService.getAllAccountInfoWithFilter(filter, refresh);
  }

  // Get node lock information
  SandboxService.getLockInformationForNode(currentNodeName, rootNode).then((lockInfo) => {
    $scope.lockInfo = lockInfo;
  }, ErrorService.handleError);
  $scope.myData = [];

  // Get default filter in account roadmap page
  function getFilter() {
    const filter = FilterService.getBaseFilter();
    filter.type = roadmapType;
    filter.node = currentNodeName;
    filter.account = utilsService.getAccountSubsetName(filter.node);
    if ($scope.lockInfo && $scope.lockInfo.sandbox) {
      filter.sandbox = $scope.lockInfo.sandbox;
    }
    filter.serviceLine = serviceLines.servicesList;
    filter.riskCategory = CognosDimentionService.riskCategories.RR_INPUT.bestCanDo;
    filter.viewLevel = $scope.viewRdmLevelPopover.getActive();
    if (filter.viewLevel === 'account') { // Do not comment this. It is important!
      filter.account = FilterService.getAccountSubsetName(filter);
      filter.serviceLine = serviceLines.totalServiceLines;
    }
    if (CognosService.CognosConfigService.prop.TRAVEL_COST === true) {
      filter.travelCost = $scope.travelCost.Flag;
    }

    // load information params
    filter.load = {
      year: timeYears.currentYear,
      quarter: timeQuarters.currentQuarter,
      riskCategory: CognosDimentionService.riskCategories.RR_INPUT.solid1,
    };
    return angular.copy(filter);
  }

  const showMoreDetails = (row) => {
    console.log(row.entity);
    itemAdjustmentModalService.showModal(
      {
        row,
        filter: getFilter(),
        rdmpLevel: $scope.viewRdmLevelPopover.getActive(),
        commitData: $scope.commitData,
        isLocked: $scope.lockInfo ? $scope.lockInfo.isLockedByCurrentUser : undefined,
        isLowest: $scope.nodeData.lowest,
        roadmapType,
        rootNode,
        currentNodeName,
      },
    );
  };

  const getAccountName = (row) => {
    if (angular.isDefined($state.current) && $state.current.name === 'roadmap.accounts') {
      return row.entity.account.Name;
    } else if (angular.isDefined($state.current) && $state.current.name === 'roadmap.contracts') {
      return UserSettingsService.getRegion() === 'EU-GTS' ? row.entity.account.Attributes['Application Name'] : row.entity.account.Attributes['Account Name'];
    } else if (angular.isDefined($state.current) && $state.current.name === 'roadmap.actions') {
      return UserSettingsService.getRegion() === 'EU-GTS' ? row.entity.account.Attributes['Application Name'] : row.entity.account.Attributes['Account Name'];
    }
    return undefined;
  };

  $ctrl.isQuarterLocked = () => CognosService.CognosConfigService.prop.readOnly;

  $ctrl.getFilter = getFilter;

  $scope.gridSizes = AccountsUIService.gridSizes;

  $scope.gridOptions = {
    headerTemplate: 'components/accounts/header-template.html',
    footerTemplate: 'components/accounts/footer-template.html',
    category: roadmapType === 'actions' ? AccountsUIService.actionsCategories : AccountsUIService.accountsCategories,
    enableFiltering: true,
    enableColumnResizing: true,
    enableGridMenu: false,
    enableColumnMenus: false,
    showColumnFooter: true,
    multiSelect: false,
    enableRowSelection: $state.current.name !== 'roadmap.actions',
    enableRowHeaderSelection: false,
    // flatEntityAccess: true,
    // fastWatch: true,
    // showGridFooter: true,
    saveWidths: true,
    saveOrder: false,
    saveFocus: true,
    saveGrouping: false,
    savePinning: false,
    saveFilter: false,
    saveSort: false,
    enableHorizontalScrollbar: 1,
    enableVerticalScrollbar: 1,
    data: 'myData',

    exporterCsvFilename: `${currentNodeName} ${roadmapType} Rdmp .csv`,
    exporterFieldCallback: AccountsUIService.exporterFieldCallback,

    onRegisterApi(gridApi) {
      $scope.gridApi = gridApi;
      $scope.gridApi.grid.registerRowsProcessor(renderableRows => roadmapCommon.getSearchRenderableRows(renderableRows, $scope.gridOptions.columnDefs, $scope.filterValue), 200);

      gridApi.selection.on.rowSelectionChanged($scope, (row) => {
        const buSummaryCardFilter = getFilter();
        if (angular.isDefined($state.current) && $state.current.name === 'roadmap.accounts') {
          if (UserSettingsService.getRegion() === 'EU-GTS') {
            $state.go('roadmap.contracts', { accName: row.entity.account.Attributes['Application Name'] }, { reload: true });
            buSummaryCardFilter.drilledInAccName = row.entity.account.Attributes['Application Name'];
          } else {
            $state.go('roadmap.contracts', { accName: row.entity.account.Name }, { reload: true });
            buSummaryCardFilter.drilledInAccName = row.entity.account.Name;
          }
          BusinessUnitCardDataService.getDataForCards(buSummaryCardFilter).then(() => {
          }, ErrorService.handleError);
        } else if (angular.isDefined($state.current) && $state.current.name === 'roadmap.contracts') {
          if (UserSettingsService.getRegion() === 'EU-GTS') {
            $state.go('roadmap.split', { roadmapType: 'split', accName: row.entity.account.Attributes['Application Name'] }, { reload: true });
            buSummaryCardFilter.drilledInAccName = row.entity.account.Attributes['Application Name'];
          } else {
            $state.go('roadmap.actions', { roadmapType: 'actions', accName: row.entity.account.Attributes['Account Name'] }, { reload: true });
            buSummaryCardFilter.drilledInAccName = row.entity.account.Attributes['Account Name'];
          }
          BusinessUnitCardDataService.getDataForCards(buSummaryCardFilter).then(() => {
          }, ErrorService.handleError);
        } else if (angular.isDefined($state.current) && $state.current.name === 'roadmap.actions') {
          // do nothing
        } else {
          showMoreDetails(row);
        }
      });
      gridApi.core.on.filterChanged($scope, () => {});

      // Setup events so we're notified when grid state changes.
      setRoadmapGridStateListener();

      // Restore previously saved state.
      restoreRoadmapGridState();

      // loading data for grid
      if ($state.current.name === 'roadmap.accounts') {
        $scope.viewRdmLevelPopover.select(1);
      } else {
        $scope.viewRdmLevelPopover.select(0);
      }
    },
  };

  $scope.changeGridHeight = (size) => {
    AccountsUIService.updateUIGridHeight($scope, size, roadmapGridSizeCacheKey);
  };

  $scope.getCurrentStateName = () => {
    let state = $scope.viewRdmLevelPopover.links.find(link => $state.current.name === link.state)
    if (state) {
      state = state.state;
    } else {
      state = '';
    }

    switch (state) {
      case 'roadmap.accounts':
        return 'Account Level Roadmap';
      case 'roadmap.contracts':
        return 'Contract Level Roadmap';
      case 'roadmap.actions':
        return 'Action Level Roadmap';
      default:
        return '';
    }
  };

  $scope.showCountryFilter = () => {
    return UserSettingsService.getRegion() === 'EU' && ($state.current.name !== 'roadmap.accounts');
  }

  $scope.viewRdmLevelPopover = {
    selections: [{
      label: 'Contract / Oppy level',
      item: 'opportunity',
    },
    {
      label: 'Account level',
      item: 'account',
    },
    ],
    links: [{
      name: 'Unit Roadmap',
      state: 'roadmap.judgement',
    }, {
      name: 'Account Roadmap',
      state: 'roadmap.accounts',
    }, {
      name: 'Contract Roadmap',
      state: 'roadmap.contracts',
    }, {
      name: 'Action Roadmap',
      state: 'roadmap.actions',
      params: "({roadmapType: 'actions'})",
    }, {
      name: 'Zero Roadmap',
      state: 'roadmap.zero',
    }],
    activeIndex: $scope.selectedView === 'account' ? 1 : 0,
    isOpen: false,
    close: function close() {
      this.isOpen = false;
    },
    select(index) {
      $scope.serviceLineFilter = undefined;
      $scope.viewRdmLevelPopover.activeIndex = index;
      $scope.selectedView = this.getActive();
      $scope.changeView(() => {
        $scope.gridApi.grid.refresh();
        applyQueryParamFiler();
      }, true);
      this.close();
    },
    getActive() {
      return this.selections[this.activeIndex].item;
    },
  };

  function applyQueryParamFiler() {
    const accName = $stateParams.accName;
    if (accName) {
      $scope.accountNameFilterOptions = [{
        name: accName,
        ticked: true,
        value: accName,
      }];
      $scope.accountNameFilterOptionsOut = [{
        name: accName,
        ticked: true,
        value: accName,
      }];
      $scope.applyFilter();
    }
  }

  $rootScope.typePopover = {
    options: {
      isOpen: false,
      activeIndex: 0,
      selections: [
        { label: 'Revenue' },
        { label: 'Cost' },
        { label: 'cGP$' },
        { label: 'cGP%' },
      ],
    },
    close(category) {
      this[category].isOpen = false;
    },
    select(category, index) {
      if (this.options.activeIndex !== index) {
        this.options.activeIndex = index;
      }
      this.setFieldForCols(index);
      this.close(category);
    },
    getExtraClass(category, index) {
      if (this[category].activeIndex === index) {
        return { active: true };
      }
      return '';
    },
    setFieldForCols(selection) {
      const selections = ['Rev', 'Cost', 'cGP$', 'cGP%'];

      const columnDefsCopy = angular.copy($scope.gridOptions.columnDefs);

      fullScreenSpinner.show();

      columnDefsCopy.forEach((i) => {
        if (i.columnPrefix === 'w/w' || i.columnPrefix === 'rev') {
          const fieldSplit = i.field.split('.');
          if (fieldSplit.length === 3) {
            const month = fieldSplit[1].split('_')[0];
            let selected;
            if (month === 'QTR' && selection === 3) {
              selected = 'QTR_cGP_%';
            } else if (month === 'QTR' && selection === 2) {
              selected = 'QTR_cGP_$';
            } else {
              selected = `${month}_${selections[selection]}`;
            }
            i.field = `${fieldSplit[0]}.${selected}.${fieldSplit[2]}`;
          }
        } else if (i.columnPrefix === 'IPPF') {
          const fieldSplit = i.field.split('.');
          if (selection === 2) {
            i.field = `${fieldSplit[0]}.${fieldSplit[1]}.QTR_cGP_$.${fieldSplit[3]}`;
          } else if (selection === 3) {
            i.field = `${fieldSplit[0]}.${fieldSplit[1]}.QTR_cGP_%.${fieldSplit[3]}`;
          } else {
            i.field = `${fieldSplit[0]}.${fieldSplit[1]}.QTR_${selections[selection]}.${fieldSplit[3]}`;
          }
        }
      });
      // Shuffle column def, so UI Grid reloads it fully.
      // 'field' value is not fully monitored for changes in UI Grid.
      $scope.gridOptions.columnDefs = [];
      $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
      $scope.gridOptions.columnDefs = columnDefsCopy;
      restoreRoadmapGridState(); // Mostly to restore saved widths
      $timeout(() => { // Hide spinner after $digest finishes
        fullScreenSpinner.hide();
        $scope.applyFilter();
      }, 0, false);
    },
  };
  $scope.typePopover = $rootScope.typePopover;

  $scope.columnFilter = {
    isOpen: false,
    weekToWeek: false,
    colsDefMap: {},
    init() {
      this.weekToWeek = false;
      for (let i = 0; i < $scope.columnFilters.length; i += 1) {
        if ($scope.columnFilters[i].columnPrefix === 'w/w') {
          if (this.weekToWeek === false) {
            this.weekToWeek = $scope.columnFilters[i].visible;
          }
          this.colsDefMap[this.getMapKey($scope.columnFilters[i])] = $scope.columnFilters[i];
        }
      }
    },
    getMapKey: el => `${el.displayName}_${el.category}`,
    close: function close() {
      this.isOpen = false;
    },
    getUniqueCategory(index, columnDef, category) {
      if (index === 0) return category;

      if (columnDef[index - 1].category === category) return null;

      return category;
    },
    countVisible(arr) {
      let count = 0;
      for (let i = 0; i < arr.length; i += 1) {
        if (arr[i].visible === true) count += 1;
      }
      return count;
    },
    typeModel(newTypeState) {
      const typeColumn = $scope.columnFilters.find(o => o.name === 'Type');
      if (arguments.length > 0 && newTypeState !== undefined) typeColumn.visible = newTypeState;
      else return typeColumn.visible;
      return null;
    },
    handleWeekToWeekFlag() {
      if ($scope.columnFilter.weekToWeek === false) {
        Object.keys(this.colsDefMap).forEach((key) => {
          const i = this.colsDefMap[key];
          i.visible = false;
        });
        $scope.columnFilters.forEach((i) => {
          if (i.enabledByW2W === true) {
            i.visible = false;
          }
        });
        return;
      }
      const wekToWeekSufix = ' W/W';
      $scope.columnFilters.forEach((i) => {
        if (i.columnPrefix === 'rev') {
          const weekToWeekCol = this.colsDefMap[this.getMapKey(i) + wekToWeekSufix];
          if (typeof weekToWeekCol === 'undefined') {
            throw new Error(`Configuration error Please double check columns definition. Key = ${this.getMapKey(i)}${wekToWeekSufix}`);
          } else {
            weekToWeekCol.visible = i.visible;
          }
        } else if (i.enabledByW2W === true) {
          const name = i.name.split('Prev')[0];
          const found = $scope.columnFilters.find(element => element.name === name);
          if (found) {
            i.visible = found.visible;
          }
        }
      });
    },
  };

  $scope.countVisible = AccountsUIService.countVisible;

  $scope.enableRows = AccountsUIService.enableRows;

  $scope.rowFilter = {
    isOpen: false,
    cancel: function cancel() {
    },
    applyFilter: function applyFilter() {

    },
  };

  $scope.calculateTotals = (rows) => {
    $log.info('calculateTOtals', rows.length);
  };

  $scope.rowFilters = AccountsUIService.getRowFilters($state, rootNode);
  $scope.rowFiltersCopy = angular.copy($scope.rowFilters);

  let firstFilterLoad = true;
  $scope.applyFilters = (doRestoreUIGrid) => {
    fullScreenSpinner.show();

    if (doRestoreUIGrid === true) {
      $scope.columnFilter.handleWeekToWeekFlag();
      handleRowFiltering();
      handleColumnFiltering();
      $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
      UserSettingsService.saveRoadmapRowsState($state.current.name, rootNode, $scope.rowFiltersCopy);
    }
    const propsMap = {};
    let sourceDataSelected = false;
    let solidRiskDataSelected = false;
    let solid1StretchDataSelected = false;
    let aggregationAlreadySet = false;
    for (let i = 0; i < $scope.gridApi.grid.columns.length; i += 1) {
      const colDef = $scope.gridApi.grid.columns[i].colDef;
      if (colDef.visible) {
        if (!aggregationAlreadySet && !colDef.aggregationType) {
          colDef.aggregationType = AccountsAggregateService.calculateTotals;
          aggregationAlreadySet = true;
        }
        const line = propsMap[colDef.category];
        if (typeof line === 'undefined') {
          propsMap[colDef.category] = {
            count: 1,
            col: colDef,
          };
        } else {
          line.count += 1;
          line.col = colDef;
        }

        if (AccountsUIService.sourceDataCategories.indexOf(colDef.category) !== -1) {
          sourceDataSelected = true;
        }
        if (AccountsUIService.solidRiskDataCategories.indexOf(colDef.category) !== -1) {
          solidRiskDataSelected = true;
        }
        if (AccountsUIService.solid1StretchDataCategories.indexOf(colDef.category) !== -1) {
          solid1StretchDataSelected = true;
        }
      }
    }
    for (let a = 0; a < $scope.gridApi.grid.options.category.length; a += 1) {
      const categoryLine = propsMap[$scope.gridApi.grid.options.category[a].name];
      if (typeof categoryLine !== 'undefined' && categoryLine.count === 1) {
        categoryLine.col.width = $scope.gridApi.grid.options.category[a].minWidt;
      } else {
        $scope.gridApi.grid.options.category[a].padding = '';
        $scope.gridApi.grid.options.category[a].height = '';
        $scope.gridApi.grid.options.category[a].width = '';
      }
    }
    if (!firstFilterLoad) {
      $timeout(AccountsUIService.updateUIGridHeight($scope), 100);
    } else {
      firstFilterLoad = false;
    }

    if (sourceDataSelected && typeof $scope.sourceAlreadyLoaded === 'undefined') {
      busService.publish(busService.events.SOURCE_DATA_SELECTED, getFilter());
    }
    if (solidRiskDataSelected && angular.isUndefined($scope.solidRiskDataSelected)) {
      busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
    }
    if (solid1StretchDataSelected && angular.isUndefined($scope.solid1StretchDataSelected)) {
      busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
    }
    if (doRestoreUIGrid === true) {
      const state = $scope.gridApi.saveState.save();
      delete state.grouping;
      delete state.pagination;
      delete state.scrollFocus;
      delete state.selection;
      delete state.treeView;
      UserSettingsService.saveRoadmapGridState($state.current.name, rootNode, state);
    }
  };

  function handleColumnFiltering() {
    let bestCanDoColumnFilter = undefined; 
    let bestCanDoColumnDef = undefined; 
    for (let i = 0; i < $scope.columnFilters.length; i += 1) {
      $scope.gridOptions.columnDefs[i].visible = $scope.columnFilters[i].visible;
      // exception should be added regarding Financial goals
      if ($scope.columnFilters[i].name  === 'bestCanDo Quarter') {
        bestCanDoColumnFilter = $scope.columnFilters[i];
        bestCanDoColumnDef = $scope.gridOptions.columnDefs[i]; 
      } else if ($scope.columnFilters[i].name  === 'financialGoalDelta' && angular.isDefined(bestCanDoColumnFilter) && angular.isDefined(bestCanDoColumnDef)) {
        bestCanDoColumnFilter.visible = bestCanDoColumnFilter.visible || $scope.columnFilters[i].visible;
        bestCanDoColumnDef.visible = bestCanDoColumnDef.visible || $scope.gridOptions.columnDefs[i].visible;
      }

    }


    const t0 = performance.now();
    UserSettingsService.saveRoadmapColumnsState($state.current.name, rootNode,
      $scope.columnFilters);
    const t1 = performance.now();
    $log.info(`TIME: Call to saveRoadmapColumnsState took ${t1 - t0} milliseconds.`);
  }

  function handleRowFiltering() {
    const rowsChanged = $scope.rowFiltersCopy.map(e => e.visible)
      .reduce((acc, e, i) => (e !== $scope.rowFilters[i].visible || acc), false);
    if (!rowsChanged) return;
    angular.copy($scope.rowFiltersCopy, $scope.rowFilters);
    $scope.gridOptions.rowHeight = AccountsUIService.getRowHeight($scope);
    $scope.gridOptions.columnFooterHeight = AccountsUIService.getRowHeight($scope);
    // Workaround for https://github.com/angular-ui/ui-grid/issues/5827
    if ($scope.myData.length > 0) {
      const myDataBack = $scope.myData;
      $scope.myData = [];
      $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
      $timeout(() => {
        $scope.myData = myDataBack; 
        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
      });
    }
  }

  $scope.gridOptions.columnDefs = roadmapCommon.getRoadmapColumnDefs($state.current.name);

  $scope.columnFilters = angular.copy($scope.gridOptions.columnDefs);

  $scope.showClusterFilter = false;
  if (utilsService.isCustomColumnIncluded($scope.columnFilters, 'Cluster')) {
    $scope.showClusterFilter = true;
  }

  $scope.showRankReasoningFilter = false;
  if (utilsService.isCustomColumnIncluded($scope.columnFilters, 'Revenue Insight')) {
    $scope.showRankReasoningFilter = true;
  }

  $scope.showClaimFlagReasoningFilter = false;
  if (utilsService.isCustomColumnIncluded($scope.columnFilters, 'Cognitive Insight')) {
    $scope.showClaimFlagReasoningFilter = true;
  }

  $scope.showCognitiveRankFilter = false;
  if (utilsService.isCustomColumnIncluded($scope.columnFilters, 'Rank')) {
    $scope.showCognitiveRankFilter = true;
  }

  $scope.showPracticeFilter = false;
  if (utilsService.isCustomColumnIncluded($scope.columnFilters, 'Practise')) {
    $scope.showPracticeFilter = true;
  }
  $scope.gridOptions.rowHeight = AccountsUIService.getRowHeight($scope);
  $scope.gridOptions.columnFooterHeight = AccountsUIService.getRowHeight($scope);
  $scope.columnFilter.init();


  function loadRevenueInformation(filter, updateMyData, updateCache, callback) {
    filter.account = utilsService.getAccountSubsetName(currentNodeName);

    filter.refresh = true;
    AccountsCachedDataService.getAllRevenueDataOptimization(filter).then((data) => {
      if (angular.isDefined(data)) {
        data.forEach((line, index) => {
          utilsService.evaluateM1PlusM2AndQtrData(line);
        });
      }
      AccountsMergeDataService.mergeAccountRevenueData($scope.commitData, data,
        filter.riskCategory);
      $scope.myData = $scope.commitData;
      if (callback) {
        callback(null, data);
      }
    }, ErrorService.handleError);
  }

  function clearCacheAfterAddUpdateOrDelete(eventFilter) {
    if (typeof eventFilter !== 'undefined') {
      const filter = angular.copy(eventFilter);
      filter.serviceLine = 'Rdmp Service Lines';
      const accountKey = ibpCache.getRegionAccountsInfoDataCacheKey(filter);
      ibpCache.accountDataCache.remove(accountKey);

      filter.account = utilsService.getAccountSubsetName(filter.node);
      const actionKey = ibpCache.getActionsDataKey(filter, 'ActionsData');
      ibpCache.actionsDataCache.remove(actionKey);
    }
  }

  /**
 * RoadmapItemUpdatedEventAccountRowChangeHandler handles UI
 * changes related with account row which was updated.
 *
 * 1) update expandble part depending what was updated (Solid, Risk, Stretch);
 * 2) update account row values;
 *
 */
  busService.defaultChannel.subscribe(busService.events.ROADMAP_ITEM_UPDATED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> RoadmapItemUpdatedEventAccountRowChangeHandler:', eventData, envelope);
    if (!String.prototype.startsWith) {
      String.prototype.startsWith = (searchString, position) => {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
      };
    }
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    ibpCache.revenueDataCache.removeAll();
    if (eventData.row.entity.roadmapType === 'actions') {
      const filterCopy = angular.copy(eventData.filter);
      if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true
        && eventData.row.entity.approval) {
        filterCopy.node = eventData.row.entity.approval.Name;
      }
      asyncService.parallel([
        (callback) => {
          refreshAccountCommitData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshAccountBestCanDoData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshOpportunitySourceData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },

      ], (err) => {
        fullScreenSpinner.hide();
        allInfoFunction(true).then((data) => {
          $scope.commitData = data;
          $scope.myData = data;
          removeSolid1($scope.myData);
          $scope.applyFilters(false);
          if (data.length === 0) {
            $scope.loadingText = 'No Records Found';
          }
          $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
          $timeout(() => {
            AccountsUIService.updateUIGridHeight($scope);
          }, 100);
          if (angular.isDefined($scope.solidRiskDataSelected)) {
            $scope.solidRiskDataSelected = false;
            busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
          }
          if (angular.isDefined($scope.solid1StretchDataSelected)) {
            $scope.solid1StretchDataSelected = false;
            busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
          }
        }, ErrorService.handleError);
        if (err) {
          ErrorService.handleError(err);
          $log.info('BusService >>> AccountsController >>> RoadmapItemUpdatedEventAccountRowChangeHandler: ERROR', err);
        } else {
          $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
          $log.info('BusService >>> AccountsController >>> RoadmapItemUpdatedEventAccountRowChangeHandler: DONE1');
        }
      });
    } else {
      const filterCopy = angular.copy(eventData.filter);
      if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true
        && eventData.row.entity.approval) {
        filterCopy.node = eventData.row.entity.approval.Name;
      }
      asyncService.parallel([
        (callback) => {
          refreshAccountCommitData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshAccountBestCanDoData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshAccountRowData(eventData.filter, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshOpportunitySourceData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshOpportunitySourceFieldData(filterCopy, eventData.row, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
        (callback) => {
          refreshSupportingInfo(filterCopy, (err) => {
            if (err) {
              return callback(err);
            }
            callback();
          });
        },
      ], (err) => {
        fullScreenSpinner.hide();
        if (angular.isDefined($scope.solidRiskDataSelected)) {
          $scope.solidRiskDataSelected = false;
          busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
        }
        if (angular.isDefined($scope.solid1StretchDataSelected)) {
          $scope.solid1StretchDataSelected = false;
          busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
        }
        if (err) {
          ErrorService.handleError(err);
          $log.info('BusService >>> AccountsController >>> RoadmapItemUpdatedEventAccountRowChangeHandler: ERROR', err);
        } else {
          $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
          $log.info('BusService >>> AccountsController >>> RoadmapItemUpdatedEventAccountRowChangeHandler: DONE');
        }
      });
    }
  });

  function refreshAccountRowData(filter, row, callback) {
    const filterCopy = angular.copy(filter);
    loadRevenueInformation(filterCopy, true, true, callback);
  }

  function refreshSupportingInfo(filter, callback) {
    AccountsCachedDataService.getAccountsInfo(angular.copy(filter)).then((result) => {
      // Merge code goes here (for now only action comment needs to be merged)
      for (let i = 0; i < $scope.myData.length; i += 1) {
        if (angular.isDefined(result[i]) && angular.isDefined(result[i].set_1)){
          $scope.myData[i].set_1['Action Comment'] = result[i].set_1['Action Comment'];
        }
      }
      callback();
    }, ErrorService.handleError);
  }

  function refreshAccountCommitData(filter, row, callback) {
    AccountsCachedDataService.getRoadmapDetailsCommitAllData(filter, true).then((data) => {
      const rows = angular.copy(row.entity.commitTabData);
      row.entity.commitTabData = data;
      if (row.isExpanded) {
        if (angular.isDefined(rows.risk)) {
          rows.risk.items.forEach((item) => {
            if (item.expended) {
              for (let i = 0; i < row.entity.commitTabData.risk.items.length; i += 1) {
                if (row.entity.commitTabData.risk.items[i].name === item.name) {
                  row.entity.commitTabData.risk.items[i].expended = true;
                }
              }
            }
          });
        }
        if (angular.isDefined(rows.solid)) {
          rows.solid.items.forEach((item1) => {
            if (item1.expended) {
              for (let i = 0; i < row.entity.commitTabData.solid.items.length; i += 1) {
                if (row.entity.commitTabData.solid.items[i].name === item1.name) {
                  row.entity.commitTabData.solid.items[i].expended = true;
                }
              }
            }
          });
        }
        let size = 0;
        if (data.risk && data.risk.items) {
          size += data.risk.items.length;
        }
        if (data.solid && data.solid.items) {
          size += data.solid.items.length;
        }
      }
      callback(null, data);
    }, (err) => {
      callback(err);
    });
  }

  function refreshAccountBestCanDoData(filter, row, callback) {
    AccountsCachedDataService.getRoadmapDetailsBestCanDoAllData(filter, true).then((data) => {
      const rows = angular.copy(row.entity.bestCanDoTabData);
      row.entity.bestCanDoTabData = data;
      if (rows && angular.isDefined(rows.stretch)) {
        rows.stretch.items.forEach((item) => {
          if (item.expended) {
            for (let i = 0; i < row.entity.bestCanDoTabData.stretch.items.length; i += 1) {
              if (row.entity.bestCanDoTabData.stretch.items[i].name === item.name) {
                row.entity.bestCanDoTabData.stretch.items[i].expended = true;
              }
            }
          }
        });
      }
      callback(null, data);
    }, (err) => {
      callback(err);
    });
  }

  function refreshOpportunitySourceData(filter, row, callback) {
    const sourceFilter = angular.copy(filter);
    sourceFilter.account = row.entity.account.Name !== undefined
      ? row.entity.account.Name : CognosDimentionService.accounts.RR_INPUT.total;
    sourceFilter.viewLevel = 'details';
    sourceFilter.serviceLine = row.entity.serviceLine.Name;
    if (row.entity.roadmapType !== 'account') {
      AccountsCachedDataService.getAllSourceDataForAllRiskCategories(sourceFilter).then((res) => {
        if (angular.isDefined(res[0]) && angular.isDefined(res[0].sourceData)) {
          row.entity.sourceData = res[0].sourceData;
          AccountsMergeDataService.mergeSourceDataForPopup(row.entity);
        }
        callback(null, []);
      }, (err) => {
        callback(err);
      });
    } else {
      callback(null, []);
    }
  }

  function refreshOpportunitySourceFieldData(filter, row, callback) {
    const sourceFilter = angular.copy(filter);
    sourceFilter.account = row.entity.account.Name !== undefined
      ? row.entity.account.Name : CognosDimentionService.accounts.RR_INPUT.total;
    sourceFilter.viewLevel = 'details';
    sourceFilter.serviceLine = row.entity.serviceLine.Name;
    if (row.entity.roadmapType !== 'account') {
      AccountsCachedDataService.getSingleOpportunityInfo(sourceFilter).then((res) => {
        if (angular.isDefined(res[0])) {
          row.entity.source = res[0].Source;
        }
        callback(null, []);
      }, (err) => {
        callback(err);
      });
    } else {
      callback(null, []);
    }
  }

  /**
 * TODO
 *
 * RoadmapAdjustmentUpdatedEventAccountRowChangeHandler handles UI changes related with account
 * row which was updated.
 *
 * 1) update expandble part depending what was updated (Solid, Risk, Stretch);
 * 2) update account row values;
 *
 */
  busService.defaultChannel.subscribe(busService.events.ROADMAP_ADJUSTMENT_UPDATED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> RoadmapAdjustmentUpdatedEventAccountRowChangeHandler:', eventData, envelope);
    fullScreenSpinner.show();
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    ibpCache.revenueDataCache.removeAll();
    const calls = [
      refreshAccountAdjustmentsDetailsData(eventData.filter, eventData.row),
      refreshAccountRowData(eventData.filter, eventData.row),
    ];
    $q.all(calls)
      .then(() => {
        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
        fullScreenSpinner.hide();
        $log.info('BusService >>> AccountsController >>> RoadmapAdjustmentUpdatedEventAccountRowChangeHandler: DONE');
      })
      .catch((err) => {
        fullScreenSpinner.hide();
        $log.info('BusService >>> AccountsController >>> RoadmapAdjustmentUpdatedEventAccountRowChangeHandler: ERROR');
        ErrorService.handleError(err);
      });

    function refreshAccountAdjustmentsDetailsData(filter, row) {
      return $q((resolve, reject) => {
        AccountsCachedDataService.getAllAccountAdjustments(filter, row.entity.account.Attributes['Account Name'], true).then((data) => {
          $log.info('getAllAccountAdjustments', data);
          const backupAccountAdjustments = angular.copy(row.entity.accountAdjustments);
          $log.info('backupAccountAdjustments', backupAccountAdjustments);
          if (backupAccountAdjustments.commit.backlog.isExpended === true) {
            data.commit.backlog.isExpended = true;
          }
          if (backupAccountAdjustments.commit.signings.isExpended === true) {
            data.commit.signings.isExpended = true;
          }
          if (backupAccountAdjustments.bestCanDo.backlog.isExpended === true) {
            data.bestCanDo.backlog.isExpended = true;
          }
          if (backupAccountAdjustments.bestCanDo.signings.isExpended === true) {
            data.bestCanDo.signings.isExpended = true;
          }
          row.entity.accountAdjustments = data;
          resolve(data);
        }, reject);
      });
    }

    function refreshAccountRowData(filter, row) {
      return $q((resolve, reject) => {
        allInfoFunction(true).then((data) => {
          if (angular.isDefined(data)) {
            data.forEach((line, index) => {
              utilsService.evaluateM1PlusM2AndQtrData(line);
            });
          }
          $scope.commitData = data;
          AccountsMergeDataService.mergeAccountRevenueData($scope.myData, data, filter.riskCategory);
          removeSolid1($scope.myData);
          $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
          fullScreenSpinner.hide();
          resolve();
        }, reject);
      });
    }
  });

  /**
 * NodeLockedEventHandler handles UI changes related with node locking.
 * Make 'Add solid', 'Add risk' and other edit action posible.
 */
  busService.defaultChannel.subscribe(busService.events.NODE_LOCKED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> NodeLockedEventHandler:', eventData, envelope);
    // update lock information
    $scope.lockInfo.isLocked = true;
    $scope.lockInfo.isLockedByCurrentUser = true;
    $scope.lockInfo.sandbox = eventData.sandbox;
    // update expandable part of data grid
    $scope.myData.forEach((e) => {
      e.isLocked = true;
      e.isEditable = !e.isAccountAdjustment && !$ctrl.isQuarterLocked();
    });
    reloadDataAfterSomeChange(true, true, false).then(() => {
      if (angular.isDefined($scope.sourceAlreadyLoaded)) {
        $scope.sourceAlreadyLoaded = false;
        busService.publish(busService.events.SOURCE_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solidRiskDataSelected)) {
        $scope.solidRiskDataSelected = false;
        busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solid1StretchDataSelected)) {
        $scope.solid1StretchDataSelected = false;
        busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
      }
      $scope.applyFilter();
      $log.info('BusService >>> AccountsController >>> NodeLockedEventHandler: DONE');
    }, (err) => {
      $log.info('BusService >>> AccountsController >>> NodeLockedEventHandler: ERROR:', err);
      ErrorService.handleError(err);
    });
    $log.info('BusService >>> AccountsController >>> NodeLockedEventHandler: DONE');
  });

  /**
 * NodeUnlockedEventHandler handles UI changes related with node unlocking.
 * Make 'Add solid', 'Add risk' and other edit action not posible.
 */
  busService.defaultChannel.subscribe(busService.events.NODE_UNLOCKED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> NodeUnlockedEventHandler:', eventData, envelope);
    // update lock information
    $scope.lockInfo.isLocked = false;
    $scope.lockInfo.isLockedByCurrentUser = false;
    $scope.lockInfo.sandbox = undefined;
    // update expandable part of data grid
    $scope.myData.forEach((e) => {
      e.isLocked = false;
      e.isEditable = false;
    });
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    reloadDataAfterSomeChange(true, true, false).then(() => {
      if (angular.isDefined($scope.sourceAlreadyLoaded)) {
        $scope.sourceAlreadyLoaded = false;
        busService.publish(busService.events.SOURCE_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solidRiskDataSelected)) {
        $scope.solidRiskDataSelected = false;
        busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solid1StretchDataSelected)) {
        $scope.solid1StretchDataSelected = false;
        busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
      }
      $scope.applyFilter();
      $log.info('BusService >>> AccountsController >>> NodeUnlockedEventHandler: DONE');
    }, (err) => {
      $log.info('BusService >>> AccountsController >>> NodeUnlockedEventHandler: ERROR:', err);
      ErrorService.handleError(err);
    });
  });

  busService.cacheChannel.subscribe(busService.events.ACCOUNT_DETAILS_DATA_CACHE_INVALIDATED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> CacheInvalidatedHandler:', eventData, envelope);
    // remove data from row elements which was loaded
    clearCacheAfterAddUpdateOrDelete(eventData.filter);
    $scope.gridApi.grid.rows.forEach((row) => {
      if (row.isInitialized) {
        row.isExpanded = false;
        row.isInitialized = false;
        if (envelope.topic === busService.events.ACCOUNT_DETAILS_COMMIT_DATA_CACHE_INVALIDATED) {
          row.entity.commitTabData = undefined;
        }
        if (envelope.topic === busService.events.ACCOUNT_DETAILS_BEST_CAN_DO_DATA_CACHE_INVALIDATED) {
          row.entity.bestCanDoTabData = undefined;
        }
      }
    });
    $log.info('BusService >>> AccountsController >>> CacheInvalidatedHandler: DONE.');
  });

  busService.defaultChannel.subscribe(busService.events.SANDBOX_PUBLISHED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> SandboxPublishedHandler:', eventData, envelope);
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    reloadDataAfterSomeChange(true, true).then(() => {
      if (angular.isDefined($scope.sourceAlreadyLoaded)) {
        $scope.sourceAlreadyLoaded = false;
        busService.publish(busService.events.SOURCE_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solidRiskDataSelected)) {
        $scope.solidRiskDataSelected = false;
        busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solid1StretchDataSelected)) {
        $scope.solid1StretchDataSelected = false;
        busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
      }
      $scope.applyFilter();
      $log.info('BusService >>> AccountsController >>> SandboxPublishedHandler: DONE.');
    }, (err) => {
      $log.info('BusService >>> AccountsController >>> SandboxPublishedHandler: ERROR:', err);
      ErrorService.handleError(err);
    });
  });

  busService.defaultChannel.subscribe(busService.events.SANDBOX_DISCARDED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> SandboxDiscardedHandler:', eventData, envelope);
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    ibpCache.revenueDataCache.removeAll();
    reloadDataAfterSomeChange(true, true).then(() => {
      if (angular.isDefined($scope.sourceAlreadyLoaded)) {
        $scope.sourceAlreadyLoaded = false;
        busService.publish(busService.events.SOURCE_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solidRiskDataSelected)) {
        $scope.solidRiskDataSelected = false;
        busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solid1StretchDataSelected)) {
        $scope.solid1StretchDataSelected = false;
        busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
      }
      $scope.applyFilter();
      $log.info('BusService >>> AccountsController >>> SandboxDiscardedHandler: DONE.');
    }, (err) => {
      $log.info('BusService >>> AccountsController >>> SandboxDiscardedHandler: ERROR:', err);
      ErrorService.handleError(err);
    });
  });

  busService.defaultChannel.subscribe(busService.events.ROADMAP_ITEM_MOVED_TO_ZERO, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> RoadmapItemMovedHandler:', eventData, envelope);
    const isFilterAplied = $scope.isFilterAplied;
    ibpCache.accountDataCache.removeAll();
    ibpCache.actionsDataCache.removeAll();
    ibpCache.revenueDataCache.removeAll();
    reloadDataAfterSomeChange(true, true).then(() => {
      if (angular.isDefined($scope.sourceAlreadyLoaded)) {
        $scope.sourceAlreadyLoaded = false;
        busService.publish(busService.events.SOURCE_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solidRiskDataSelected)) {
        $scope.solidRiskDataSelected = false;
        busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solid1StretchDataSelected)) {
        $scope.solid1StretchDataSelected = false;
        busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
      }
      $scope.applyFilter();
      $scope.isFilterAplied = isFilterAplied;
      $log.info('BusService >>> AccountsController >>> RoadmapItemMovedHandler: DONE.');
    }, (err) => {
      $log.info('BusService >>> AccountsController >>> RoadmapItemMovedHandler: ERROR:', err);
      ErrorService.handleError(err);
    });
  });

  busService.defaultChannel.subscribe(busService.events.SOURCE_DATA_SELECTED, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> SourceDataSelectedHandler:', eventData, envelope);
    loadAllSourceData(eventData).then(() => {
      $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
    });
  });

  busService.defaultChannel.subscribe(busService.events.SOLID_RISK_DATA_SELECTED, $scope, (eventData, envelope) => {
    if (eventData.type !== 'actions') {
      const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
      const riskCatSets = [riskCategories.solid, riskCategories.risk];
      const t1 = performance.now();
      AccountsCachedDataService.getSolidRiskStretchRevenueData(eventData, riskCatSets)
        .then((revenueData) => {
          AccountsCachedDataService.mergeRevenueData($scope.commitData, revenueData);
          $scope.myData = $scope.commitData;
          $log.info('Time taken to get and merge solid risk data:');
          $log.info((performance.now() - t1) / 1000);
          $scope.solidRiskDataSelected = true;
          $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
        });
    }
  });
  busService.defaultChannel.subscribe(busService.events.SOLID1_STRETCH_DATA_SELECTED, $scope, (eventData, envelope) => {
    if (eventData.type !== 'actions') {
      const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
      const riskCatSets = [riskCategories.stretch, riskCategories.solid1];
      const t1 = performance.now();
      AccountsCachedDataService.getSolidRiskStretchRevenueData(eventData, riskCatSets)
        .then((revenueData) => {
          AccountsCachedDataService.mergeRevenueData($scope.commitData, revenueData);
          $scope.myData = $scope.commitData;
          $log.info('Time taken to get and merge solid1 stretch data:');
          $log.info((performance.now() - t1) / 1000);
          $scope.solid1StretchDataSelected = true;
          $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
        });
    }
  });

  function loadAllSourceData(filter) {
    const deferred = $q.defer();
    const filter1 = angular.copy(filter);
    filter1.riskCategory = CognosDimentionService.riskCategories.RR_INPUT.bestCanDo;
    if ($scope.sourceAlreadyLoaded === true) {
      deferred.resolve();
    } else {
      AccountsCachedDataService.getRdmSourceData(filter1).then((values) => {
        AccountsMergeDataService.mergeDataSource(values, $scope.commitData);
        $scope.myData = $scope.commitData;
        $scope.sourceAlreadyLoaded = true;
        deferred.resolve();
      }, (e) => {
        deferred.reject(e);
      });
    }
    return deferred.promise;
  }

  function loadExportSolidRiskStretchData(filter) {
    const deferred = $q.defer();
    const filter1 = angular.copy(filter);
    if ($scope.solidRiskDataSelected === true && $scope.solid1StretchDataSelected === true) {
      deferred.resolve();
    } else if ($scope.solidRiskDataSelected === false
      && $scope.solid1StretchDataSelected === true) {
      const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
      const riskCatSets = [riskCategories.solid, riskCategories.risk];
      AccountsCachedDataService.getSolidRiskStretchRevenueData(filter1, riskCatSets)
        .then((values) => {
          AccountsCachedDataService.mergeRevenueData($scope.commitData, values);
          $scope.myData = $scope.commitData;
          $scope.solidRiskDataSelected = true;
          deferred.resolve();
        }, (e) => {
          deferred.reject(e);
        });
    } else if ($scope.solid1StretchDataSelected === false
      && $scope.solidRiskDataSelected === true) {
      const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;
      const riskCatSets = [riskCategories.stretch, riskCategories.solid1];
      AccountsCachedDataService.getSolidRiskStretchRevenueData(filter1, riskCatSets)
        .then((values) => {
          AccountsCachedDataService.mergeRevenueData($scope.commitData, values);
          $scope.myData = $scope.commitData;
          $scope.solid1StretchDataSelected = true;
          deferred.resolve();
        }, (e) => {
          deferred.reject(e);
        });
    } else {
      AccountsCachedDataService.getSolidRiskStretchRevenueData(filter1).then((values) => {
        AccountsCachedDataService.mergeRevenueData($scope.commitData, values);
        $scope.myData = $scope.commitData;
        $scope.solidRiskDataSelected = true;
        $scope.solid1StretchDataSelected = true;
        deferred.resolve();
      }, (e) => {
        deferred.reject(e);
      });
    }
    return deferred.promise;
  }


  busService.defaultChannel.subscribe(busService.events.FILTER_UPDATED_ROADMAP_UPDATE, $scope, (eventData, envelope) => {
    $log.info('BusService >>> AccountsController >>> FilterUpdatedEventHandler:', eventData, envelope);
    delete $scope.sourceAlreadyLoaded;
    reloadDataAfterSomeChange(true, true).then(() => {
      if (angular.isDefined($scope.solidRiskDataSelected)) {
        $scope.solidRiskDataSelected = false;
        busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
      }
      if (angular.isDefined($scope.solid1StretchDataSelected)) {
        $scope.solid1StretchDataSelected = false;
        busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
      }
      $scope.applyFilter();
      $log.info('BusService >>> AccountsController >>> FilterUpdatedEventHandler: DONE');
    }, (err) => {
      $log.info('BusService >>> AccountsController >>> FilterUpdatedEventHandler: ERROR', err);
      ErrorService.handleError(err);
    });
  });

  function setExistingCommentList(data) {
    const accountNameField = UserSettingsService.getRegion() === 'EU-GTS' ? 'Application Name' : 'Account Name'
    const nodes = [];
    if (data) {
      for (let i = 0; i < data.length; i += 1) {
        const element = data[i];
        nodes.push(element.account.Attributes[accountNameField]);
      }
      cadenceService.getExistingNodes(nodes,
        FilterService.getUiFilter().year.value,
        FilterService.getUiFilter().quarter.value[0]).then((res) => {
        let nodeComments = {}; 
        if (angular.isArray(res.data)) {
          res.data.forEach((comment) => {
            if (comment.nodeName && comment.text) {
              nodeComments[comment.nodeName] = comment.text;
            }
          });

        }
        for (let i = 0; i < data.length; i += 1) {
          const element = data[i];
          if (nodeComments[element.account.Attributes[accountNameField]]) {
            element.account.hasCadenceComment = true;
            element.account.cadenceComment = nodeComments[element.account.Attributes[accountNameField]];
          }
        }
      });
    }
  }

  function reloadDataAfterSomeChange(showSpinner, refreshCache, resetFilters, doRestoreUIGrid) {
    resetFilters = typeof resetFilters !== 'undefined' ? resetFilters : true;
    return $q((resolve, reject) => {
      $scope.myData = [];
      const filter = getFilter();
      if (refreshCache === true) {
        filter.refresh = true;
      }
      if ($scope.selectedView === 'account') {
        refreshCache = true;
      }
      if (showSpinner === true) {
        fullScreenSpinner.show();
      }
      allInfoFunction(refreshCache).then((data) => {
        $scope.applyFilters(doRestoreUIGrid);
        $scope.commitData = data;
        $scope.myData = data;

        if ($scope.selectedView === 'account') setExistingCommentList($scope.myData);
        removeSolid1($scope.myData);
        if (data.length === 0) {
          $scope.loadingText = 'No Records Found';
        }

        if (resetFilters) {
          resetAllFilters();
        }
        if (angular.isDefined($scope.solidRiskDataSelected)) {
          $scope.solidRiskDataSelected = false;
          busService.publish(busService.events.SOLID_RISK_DATA_SELECTED, getFilter());
        } else {
          AccountsCachedDataService.mergeRevenueData($scope.myData);
        }
        if (angular.isDefined($scope.solid1StretchDataSelected)) {
          $scope.solid1StretchDataSelected = false;
          busService.publish(busService.events.SOLID1_STRETCH_DATA_SELECTED, getFilter());
        } else {
          AccountsCachedDataService.mergeRevenueData($scope.myData);
        }
        $scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.ALL);
        const t0 = performance.now();
        $timeout(() => {
          const t1 = performance.now();
          $log.info(`TIME: Call to reloadDataAfterSomeChange1 took ${t1 - t0} milliseconds.`);
          AccountsUIService.updateUIGridHeight($scope);
        }, 100);
        if (showSpinner === true) {
          fullScreenSpinner.hide();
        }
        resolve();
      }, reject);
    });
  }

  function setRoadmapGridStateListener() {
    function saveRoadmapGridState() {
      const state = $scope.gridApi.saveState.save();
      delete state.pagination;
      delete state.scrollFocus;
      delete state.selection;
      delete state.treeView;
      UserSettingsService.saveRoadmapGridState($state.current.name, rootNode, state);
    }
    $scope.gridApi.colResizable.on.columnSizeChanged($scope, saveRoadmapGridState);
    $scope.gridApi.core.on.columnVisibilityChanged($scope, saveRoadmapGridState);
    $scope.gridApi.core.on.filterChanged($scope, saveRoadmapGridState);
  }

  function restoreRoadmapGridState() {
    $timeout(() => {
      const state = UserSettingsService.getRoadmapGridState($state.current.name, rootNode);
      if (state) {
        delete state.pagination;
        delete state.scrollFocus;
        delete state.selection;
        delete state.treeView;
        $scope.gridApi.saveState.restore($scope, state);
      }
    });
  }

  $scope.$watch('filtersOpen', (newValue, oldValue) => {
    if (newValue && $scope.filtersOpen) {
      $scope.columnFilter.isOpen = false;
      // $scope.viewRdmLevelPopover.isOpen = false;
      getFilterOptions($scope.myData);
    }
  });

  $scope.$watch('myData', (newValue, oldValue) => {
    if (newValue && newValue.length > 0) {
      if ($scope.filtersOpen) {
        getFilterOptions(newValue);
      }
    }
  });

  $scope.localLang = {
    selectAll: 'Tick all',
    selectNone: 'All',
    reset: 'Undo all',
    search: 'Type here to search...',
    nothingSelected: 'All', // default-label is deprecated and replaced with this.
  };

  /**
 * This function provides data foe UI (RDM) filters options selection.
 *
 */
  function getFilterOptions(data) {
    const acountNames = [];
    const contractNums = [];
    $scope.allServiceLines = [];
    $scope.allPractices = [];
    const serviLineMap = {};
    const salesStatus = [];
    const actionTaskid = [];
   
    const scStatus = [];
    const source = [];
    const roadmapType = [];
    const industryNames = [];
    const countryNames = [];
    const clusterNames = [];
    const cognitiveRankNames = [];
    const cognitiveRankReasoningNames = [];
    const ragArray = [];
    const revenueRiskCategories = [];

    const legalNumbers = [];
    const map = {};
    const contractNumMap = {};
    const salesStatusMap = {};
    const actionTaskidMap = {};
    const scStatusMap = {};
    const sourceMap = {};
    const roadmapTypeMap = {};
    const industryNameMap = {};
    const clusterNameMap = {};
    const practiceNameMap = {};
    const cognitiveRankNameMap = {};
    const cognitiveRankReasoningNameMap = {};
    const countryNameMap = {};

    const legalNumberMap = {};
    const len = $scope.myData.length;
    for (let i = 0; i < len; i += 1) {
      const line = $scope.myData[i];

      const accountNameValue = UserSettingsService.getRegion() === 'EU-GTS'
        ? line.account.Attributes['Application Name']
        : line.account.Attributes['Account Name'];
      let item = map[accountNameValue];
      if (typeof accountNameValue !== 'undefined') {
        if (typeof item === 'undefined') {
          acountNames.push({
            name: accountNameValue,
            value: accountNameValue,
          });
          map[accountNameValue] = 1;
        }
      }
      if (angular.isDefined(line.action)) {
        item = map[line.action.RAG_load];
        if (typeof line.action.RAG_load !== 'undefined') {
          if (typeof item === 'undefined' && line.action.RAG_load !== '') {
            ragArray.push({
              name: getRAGName(line.action.RAG_load),
              value: line.action.RAG_load,
            });
            map[line.action.RAG_load] = 1;
          }
        }
      }

      if (angular.isDefined(line.action)) {
        item = map[line.action.RAG_load];
        if (typeof line.action.RAG_load !== 'undefined') {
          if (typeof item === 'undefined' && line.action.RAG_load !== '') {
            ragArray.push({
              name: getRAGName(line.action.RAG_load),
              value: line.action.RAG_load,
            });
            map[line.action.RAG_load] = 1;
          }
        }
      }
      if (angular.isDefined(line.revenueRiskCategory)) {
        const rrCat = line.revenueRiskCategory.Name.split(' ')[0];
        item = map[rrCat];
        if (line.revenueRiskCategory.Name !== undefined) {
          if (item === undefined) {
            revenueRiskCategories.push({
              name: rrCat,
              value: rrCat,
            });
            map[rrCat] = 1;
          }
        }
      }

      item = contractNumMap[line.account.Name];
      if (item === undefined) {
        contractNums.push({
          name: line.account.Name,
          value: line.account.Name,
        });
        contractNumMap[line.account.Name] = 1;
      }
      if (StaticMappingService.getRegionReadableProp().name === 'North America (GBS)') {
        if (line.serviceLine && line.serviceLine.slName !== 'Total Service Lines') {
          AccountsUIService.setFilterOptions($scope.allServiceLines, serviLineMap,
            line.serviceLine.slName);
        }
        AccountsUIService.setFilterOptions($scope.allPractices, practiceNameMap,
          line.serviceLine.practiceName);
      } else if (line.serviceLine && line.serviceLine.Name !== 'Total Service Lines') {
        AccountsUIService.setFilterOptions($scope.allServiceLines, serviLineMap,
          line.serviceLine.Name);
      }
      if (!$scope.nodeData.top && line.account.Attributes['Legal Contract Number'] !== undefined) {
        item = legalNumberMap[line.account.Attributes['Legal Contract Number']];
        if (item === undefined) {
          legalNumbers.push({
            name: line.account.Attributes['Legal Contract Number'],
            value: line.account.Attributes['Legal Contract Number'],
          });
          legalNumberMap[line.account.Attributes['Legal Contract Number']] = 1;
        }
      }
      if (line.load['Sales Status_load'] !== undefined) {
        item = salesStatusMap[line.load['Sales Status_load']];
        if (item === undefined && line.load['Sales Status_load'] !== '') {
          salesStatus.push({
            name: line.load['Sales Status_load'],
            value: line.load['Sales Status_load'],
          });
          salesStatusMap[line.load['Sales Status_load']] = 1;
        }
      }

      if (line.load['Action Task_id_load'] !== undefined) {
        item = actionTaskidMap[line.load['Action Task_id_load']];
        if (item === undefined && line.load['Action Task_id_load'] !== '') {
          actionTaskid.push({
            name: line.load['Action Task_id_load'],
            value: line.load['Action Task_id_load'],
          });
          actionTaskidMap[line.load['Action Task_id_load']] = 1;
        }
      }
      
    


      if (line.load['Roadmap Status_load'] !== undefined) {
        item = scStatusMap[line.load['Roadmap Status_load']];
        if (item === undefined && line.load['Roadmap Status_load'] !== '') {
          scStatus.push({
            name: line.load['Roadmap Status_load'],
            value: line.load['Roadmap Status_load'],
          });
          scStatusMap[line.load['Roadmap Status_load']] = 1;
        }
      }
      if (line.source !== undefined) {
        item = sourceMap[line.source];
        if (item === undefined && line.source !== '') {
          source.push({
            name: line.source,
            value: line.source,
          });
          sourceMap[line.source] = 1;
        }
      }
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        if (line.roadmapItemType !== undefined && line.roadmapItemType.Name !== undefined && line.roadmapItemType.Name !== '') {
          item = roadmapTypeMap[line.roadmapItemType.Name];
          if (item === undefined && line.roadmapItemType.Name !== '') {
            roadmapType.push({
              name: line.roadmapItemType.Name,
              value: line.roadmapItemType.Name,
            });
            roadmapTypeMap[line.roadmapItemType.Name] = 1;
          }
        }
      } else {
        if (line.load['Roadmap Item Type_load'] !== undefined || line.load['Roadmap Item Type_load'] !== '') {
          item = roadmapTypeMap[line.load['Roadmap Item Type_load']];
          if (item === undefined && line.load['Roadmap Item Type_load'] !== '') {
            roadmapType.push({
              name: line.load['Roadmap Item Type_load'],
              value: line.load['Roadmap Item Type_load'],
            });
            roadmapTypeMap[line.load['Roadmap Item Type_load']] = 1;
          }
        }
      }
      if (line.set_1 &&
        (line.set_1['Cluster Name'] !== undefined || line.set_1['Cluster Name'] !== '')) {
        item = clusterNameMap[line.set_1['Cluster Name']];
        if (item === undefined && angular.isDefined(line.set_1['Cluster Name']) &&
          line.set_1['Cluster Name'] !== '') {
          clusterNames.push({
            name: line.set_1['Cluster Name'],
            value: line.set_1['Cluster Name'],
          });
          clusterNameMap[line.set_1['Cluster Name']] = 1;
        }
      }
      if (line.account.Attributes.Industry !== undefined) {
        // Filtering is case insensitive
        const string = line.account.Attributes.Industry.toUpperCase();

        item = industryNameMap[string];
        if (item === undefined) {
          industryNames.push({
            name: toTitleCase(string),
            value: toTitleCase(string),
          });
          industryNameMap[string] = 1;
        }
      }

      if (line.account.Attributes.Country !== undefined) {
        // Filtering is case insensitive
        const string = line.account.Attributes.Country.toUpperCase();

        item = countryNameMap[string];
        if (item === undefined) {
          countryNames.push({
            name: toTitleCase(string),
            value: toTitleCase(string),
          });
          countryNameMap[string] = 1;
        }
      }

      if (typeof line.account.Attributes['Cognitive Rank'] !== 'undefined') {
        item = cognitiveRankNameMap[line.account.Attributes['Cognitive Rank']];
        if (typeof item === 'undefined') {
          cognitiveRankNames.push({
            name: line.account.Attributes['Cognitive Rank'],
            value: line.account.Attributes['Cognitive Rank'],
          });
          cognitiveRankNameMap[line.account.Attributes['Cognitive Rank']] = 1;
        }
      } else {
        item = cognitiveRankNameMap['None'];
        if (typeof item === 'undefined') {
          cognitiveRankNames.push({
            name: 'None',
            value: 'None',
          });
          cognitiveRankNameMap['None'] = 1;
        }
      }

      if (typeof line.account.Attributes['Cognitive Rank Reasoning'] !== 'undefined') {
        const rankReasoningValues = line.account.Attributes['Cognitive Rank Reasoning'].split(';');
        rankReasoningValues.forEach((rankReasoning, index) => {
          const rankReasoningExcludingNumbers = rankReasoning.replace(/\d+|%/g, '').trim();
          item = cognitiveRankReasoningNameMap[rankReasoningExcludingNumbers];
          if (typeof item === 'undefined') {
            cognitiveRankReasoningNames.push({
              name: rankReasoningExcludingNumbers,
              value: rankReasoningExcludingNumbers,
            });
            cognitiveRankReasoningNameMap[rankReasoningExcludingNumbers] = 1;
          }
        });
      } else {
        item = cognitiveRankReasoningNameMap['None'];
        if (typeof item === 'undefined') {
          cognitiveRankReasoningNames.push({
            name: 'None',
            value: 'None',
          });
          cognitiveRankReasoningNameMap['None'] = 1;
        }
      }
    }

    // sort industry name values for multi-select filter
    industryNames.sort((a, b) => {
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;
      return 0;
    });

    countryNames.sort((a, b) => {
      if (a.value < b.value) return -1;
      if (a.value > b.value) return 1;
      return 0;
    });

    acountNames.sort((a, b) => {
      if (a.value.toUpperCase() < b.value.toUpperCase()) return -1;
      if (a.value.toUpperCase() > b.value.toUpperCase()) return 1;
      return 0;
    });
    clusterNames.sort((a, b) => {
      if (a.value.toUpperCase() < b.value.toUpperCase()) return -1;
      if (a.value.toUpperCase() > b.value.toUpperCase()) return 1;
      return 0;
    });
    $scope.allPractices.sort((a, b) => {
      if (a.value.toUpperCase() < b.value.toUpperCase()) return -1;
      if (a.value.toUpperCase() > b.value.toUpperCase()) return 1;
      return 0;
    });

    cognitiveRankNames.sort((a, b) => {
      if (a.value === 'None') return -1;
      if (b.value === 'None') return 1;
      if (a.value.toUpperCase() < b.value.toUpperCase()) return -1;
      if (a.value.toUpperCase() > b.value.toUpperCase()) return 1;
      return 0;
    });
    cognitiveRankReasoningNames.sort((a, b) => {
      if (a.value === 'None') return -1;
      if (b.value === 'None') return 1;
      if (a.value.toUpperCase() < b.value.toUpperCase()) return -1;
      if (a.value.toUpperCase() > b.value.toUpperCase()) return 1;
      return 0;
    });

    $scope.accountNameFilterOptions = acountNames;
    $scope.contractNumberFilterOptions = contractNums;
    $scope.legalNumberFilterOptions = legalNumbers;
    $scope.salesStatusFilterOptions = salesStatus;
    $scope.scStatusFilterOptions = scStatus;
    $scope.actionTaskIdFilterOptions = actionTaskid;
  
    $scope.sourceFilterOptions = source;
    $scope.roadmapTypeOptions = roadmapType;
    $scope.industryFilterOptions = industryNames;
    $scope.countryFilterOptions = countryNames;
    $scope.clusterNameFilterOptions = clusterNames;
    $scope.cognitiveRankReasoningFilterOptions = cognitiveRankReasoningNames;
    $scope.cognitiveRankFilterOptions = cognitiveRankNames;
    $scope.practiceNameFilterOptions = $scope.allPractices;
    
    $scope.ragFilterOptions = ragArray;
    $scope.revenueRiskCategoryFilterOptions = revenueRiskCategories;
    $scope.affiliatesFilterOptions = [{
      name: 'All',
      value: '',
    },
    {
      name: 'IBM',
      value: 'No',
    },
    {
      name: 'Affiliates',
      value: 'Yes',
    },
    ];

    let totalServiceLinesSelected = false;
    if ($scope.allServiceLines.length === 0) {
      if (angular.isUndefined($scope.serviceLineFilterOptionsOut)) {
        totalServiceLinesSelected = true;
      }
      $scope.allServiceLines = UserSettingsService.getServiceLines(currentNodeName);
    } else {
      UserSettingsService.saveServiceLines(currentNodeName, $scope.allServiceLines);
    }
    $scope.serviceLineFilterOptions = angular.copy($scope.totalSlInitOptions);
    $log.info('totalServiceLinesSelected', totalServiceLinesSelected);
    if (totalServiceLinesSelected) {
      $scope.serviceLineFilterOptions[1].ticked = true;
    }
    $scope.serviceLineFilterOptions =
      $scope.serviceLineFilterOptions.concat(angular.copy($scope.allServiceLines));
    $scope.serviceLineFilterOptions.push({
      name: 'All Service lines',
      slGroup: false,
    });
    $scope.allServiceLines.forEach((i) => {
      $scope.serviceLineFilterMap[i.name] = 1;
    });

    utilsService.filterOptionPreSelection($scope.serviceLineFilterOptionsOut,
      $scope.serviceLineFilterOptions);
    utilsService.filterOptionPreSelection($scope.accountNameFilterOptionsOut,
      $scope.accountNameFilterOptions);
    utilsService.filterOptionPreSelection($scope.contractNumberFilterOptionsOut,
      $scope.contractNumberFilterOptions);
    utilsService.filterOptionPreSelection($scope.salesStatusFilterOptionsOut,
      $scope.salesStatusFilterOptions);
    utilsService.filterOptionPreSelection($scope.scStatusFilterOptionsOut,
      $scope.scStatusFilterOptions);
      
      utilsService.filterOptionPreSelection($scope.actionTaskIdFilterOptionsOut,
        $scope.actionTaskIdFilterOptions);

    utilsService.filterOptionPreSelection($scope.sourceFilterOptionsOut,
      $scope.sourceFilterOptions);
    utilsService.filterOptionPreSelection($scope.industryFilterOptionsOut,
      $scope.industryFilterOptions);
    utilsService.filterOptionPreSelection($scope.countryFilterOptionsOut,
        $scope.countryFilterOptions);
    utilsService.filterOptionPreSelection($scope.legalNumberFilterOptionsOut,
      $scope.legalNumberFilterOptions);
    utilsService.filterOptionPreSelection($scope.roadmapTypeOptionsOut,
      $scope.roadmapTypeOptions);
    utilsService.filterOptionPreSelection($scope.clusterNameFilterOptionsOut,
      $scope.clusterNameFilterOptions);
    utilsService.filterOptionPreSelection($scope.cognitiveRankFilterOptionsOut,
      $scope.cognitiveRankFilterOptions);
    utilsService.filterOptionPreSelection($scope.cognitiveRankReasoningFilterOptionsOut,
      $scope.cognitiveRankReasoningFilterOptions);
    utilsService.filterOptionPreSelection($scope.ragFilterOptionsOut,
      $scope.ragFilterOptions);
    utilsService.filterOptionPreSelection(
      $scope.revenueRiskCategoryFilterOptionsOut,
      $scope.revenueRiskCategoryFilterOptions);
    utilsService.filterOptionPreSelection($scope.practiceNameFilterOptionsOut,
      $scope.practiceNameFilterOptions);
  }

  function getRAGName(rag) {
    switch (rag.toUpperCase()) {
      case 'R':
        return 'Red';
      case 'A':
        return 'Amber';
      case 'G':
        return 'Green';
      case '':
        return 'None';
      default:
        return '';
    }
  }

  // Converts string to title case
  function toTitleCase(str) {
    return str.replace(/[^\s]+/g, txt =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  function removeSolid1(data) {
    if (UserSettingsService.getRegion() === 'EU') {
      for (let i = data.length - 1; i >= 0; i -= 1) {
        if (data[i].revenueRiskCategory && data[i].revenueRiskCategory.Name === 'Solid - 1') {
          data.splice(i, 1);
        }
      }
    }
  }

  $scope.allServiceLines = null;

  $scope.totalSlInitOptions = [{
    name: 'Consolidated',
    slGroup: true,
    special: true,
    consolicated: true,
  },
  {
    name: 'Total Service Lines',
    ticked: false,
    special: true,
    consolicated: true,
  },
  {
    name: 'Consolidated',
    slGroup: false,
    special: true,
  },
  {
    name: 'All Service lines',
    slGroup: true,
  },
  ];

  $scope.modernBrowsers = [];

  $scope.onServiceLinesMultiSelectItemClick = (data) => {
    $scope.serviceLineFilterOptions.forEach((i) => {
      if (angular.isUndefined(i.ticked)) {
        return;
      }
      if (data.consolicated && angular.isUndefined(i.consolicated)) {
        i.ticked = false;
        return;
      }
      if (angular.isUndefined(data.consolicated) && i.consolicated) {
        i.ticked = false;
      }
      if (data.consolicated && i.consolicated) {
        if (data.name === i.name) {
          i.ticked = true;
        } else {
          i.ticked = false;
        }
      }
    });
  };

  $scope.changeToContract = (e, row) => {
    e.stopPropagation();
    showMoreDetails(row);
  };

  $scope.exportRdmp = (isNotActionsRdmp, buName) => {
    const promiseArr = [];
    if (isNotActionsRdmp) {
      promiseArr.push(loadExportSolidRiskStretchData(getFilter()));
    }

    fullScreenSpinner.show();
    $q.all(promiseArr).then(() => {
      $scope.filteredRows = [];
      $scope.gridApi.grid.rows.forEach((row) => {
        if (row.visible === true) {
          $scope.filteredRows.push(row.entity);
        }
      });
      fullScreenSpinner.hide();
      ExportSettingsService.showModal($scope.myData, $scope.filteredRows,
        $scope.gridOptions.columnDefs, $scope.sourceAlreadyLoaded, rootNode, getFilter,
        loadAllSourceData, buName, roadmapType, $scope.isFilterAplied);
    });
  };

  $scope.onRdmpLvlChange = (rdmpLevel) => {
    if (rdmpLevel && rdmpLevel.toLowerCase().indexOf('zero') > -1) {
      ExportSettingsService.isZeroRdmp = true;
    } else {
      ExportSettingsService.isZeroRdmp = false;
    }
    $scope.filteredRows = undefined;
    $scope.isFilterAplied = false;
  };

  $scope.showClearActionsModal = () => {
    ClearActionsModalService.showClearActionsModal();
  };

  $scope.isActionsClearingEnabled = () => {
    const filter = FilterService.getBaseFilter();
    const isNAGTS = UserSettingsService.getRegion() === 'NA-GTS';
    const isCurrentOrFutureQtr = utilsService.getWeekType(filter.year, filter.quarter)
      === CognosDimentionService.weeks.RR_INPUT.currentWeek;
    const isLocked = $scope.lockInfo && $scope.lockInfo.isLockedByCurrentUser === true;
    const isLowest = $scope.nodeData && $scope.nodeData.lowest;
    const isAccounts = $state.current.name === 'roadmap.actions';

    return isNAGTS && isCurrentOrFutureQtr && isLocked && !isLowest && isAccounts;
  };
}

AccountsController.$inject = [
  '$scope', '$window', '$log', '$q', '$stateParams', '$timeout', 'AccountsUIService',
  'utilsService', 'uiGridConstants', 'ibpCache', 'SandboxService', 'AccountsCachedDataService',
  '$uibModal', 'busService', 'fullScreenSpinner', 'asyncService', 'ErrorService', 'CognosDimentionService',
  'StaticMappingService', 'FilterService', 'AccountsMergeDataService', 'AccountsAggregateService', '$rootScope',
  'UserSettingsService', 'CognosService', 'NodesHierarchyCachedDataService', 'CsvExportService',
  'RestoreSourceDataService', 'AccountsEditService', 'itemAdjustmentModalService', '$state', 'ExportSettingsService',
  'CognosConfigService', 'cadenceService', 'BusinessUnitCardDataService', 'ClearActionsModalService', 'roadmapCommon',
];

module.exports = AccountsController;
