import debounce from 'lodash/debounce';
import { SolidCurrentWeekField, RiskCurrentWeekField, StretchCurrentWeekField,
  CommitCurrentWeekField, SolidPrevWeekField, RiskPrevWeekField,
  StretchPrevWeekField, CommitPrevWeekField, BestCanDoCurrentWeekField, BestCanDoPrevWeekField,
  BaseCurrentWeekField, BasePrevWeekField, Solid1TargetIMTCurrentWeek, Solid1TargetIOTCurrentWeek, SplitLoadCurrentWeek } from '../../core/grid/RiskCategoryFIeld';

const angular = require('angular');

AccountsUIService.$inject = ['uiGridConstants', 'utilsService', 'CognosService',
  '$templateCache', 'StaticMappingService', 'UserSettingsService', 'fullScreenSpinner', 'ibpCache', '$rootScope', '$window',
  '$timeout'];

function AccountsUIService(uiGridConstants, utilsService, CognosService,
  $templateCache, StaticMappingService, UserSettingsService, fullScreenSpinner, ibpCache, $rootScope, $window,
  $timeout) {
  const displayDateFormat = CognosService.CognosConfigService.prop.DISPLAY_DATE_FORMAT || 'yyyy-MM-dd';
  const application = StaticMappingService.getRegionReadableProp().name;

  this.changeSubgridTab = (row, tab) => {
    row.selectedTab = tab;
  };

  function getColumnDefinition(name, displayName, cellFilter, format, valueSign) {
    return {
      name,
      displayName,
      cellFilter,
      format,
      valueSign,
    };
  }

  function getNumberColumnDefinition(name, displayName) {
    return getColumnDefinition(name, displayName, 'number', '3');
  }

  function getDollarColumnDefinition(name, displayName) {
    return getColumnDefinition(name, displayName, 'number', '3', '$');
  }

  function getPercentColumnDefinition(name, displayName) {
    return getColumnDefinition(name, displayName, 'number', '1', '%');
  }

  const sortingAlgorithm = (a, b) => {
    if (a === undefined) {
      a = 0;
    }
    if (b === undefined) {
      b = 0;
    }
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  };

  const sortingAlgorithmForText = (a, b) => {
    if (a === undefined || a.trim() === '') {
      a = 0;
    }
    if (b === undefined || b.trim() === '') {
      b = 0;
    }
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  };

  function getPriority(text, valuesInOrder, direction) {
    let priority = direction === 'desc' ? -1: 1000; 
    let textToBeProcessed = angular.isUndefined(text) ? '': text.toLowerCase(); 
    valuesInOrder.forEach((value, index) => {
      if (textToBeProcessed === value) {
        priority = index; 
      }
    })
    return priority;
  }

  // Get source data for source tab
  this.getRdmpSourceData = (data) => {
    const columnDefs = [
      getColumnDefinition('source', 'source'),
      getNumberColumnDefinition('sourceRev', 'Delta'),
      getColumnDefinition('sourceBCDRev', 'BCD Rev'),
      getColumnDefinition('Identified', 'Identified'),
      getColumnDefinition('Yield Delta"', 'Yield Delta"'),
    ];

    let sourceRev;
    if (typeof data['Contract End Date_load'] !== 'undefined') {
      sourceRev = data.dsCommitRev - data['QTR Rev'];
    } else {
      sourceRev = data.scdsCommitRev - data['QTR Rev'];
    }

    let sourceBCDRev;
    if (typeof data['Contract End Date_load'] !== 'undefined') {
      sourceBCDRev = data.bcddsCommitRev - data.bcdqtrrev;
    } else {
      sourceBCDRev = data.scbcddsCommitRev - data.bcdqtrrev;
    }

    const source = 'PCW load';
    let pcwRev = '';
    let signYieldPCW = '';
    let pcwPerformed = '';
    if (typeof data['Contract End Date_load'] === 'undefined') {
      pcwRev = data['PCW Identified'];
      pcwPerformed = data['PCW Performed'];
      signYieldPCW = pcwRev - data['QTR Rev'];
    }

    const commitData = [{
      source,
      sourceRev,
      sourceBCDRev,
      Identified: pcwRev,
      Performed: pcwPerformed,
      'Yield Delta': signYieldPCW,
    }];
    return {
      columnDefs,
      data: commitData,
    };
  };

  this.getSourceTableData = (data) => {
    const columnDefs = [
      getNumberColumnDefinition('dsCommitRev', 'Delta'),
      getNumberColumnDefinition('dsCommitRevPrev', 'w/w'),
      getNumberColumnDefinition('bcddsCommitRev', 'BCD Rev'),
      getNumberColumnDefinition('bcddsCommitRevPrev', 'w/w'),
      getNumberColumnDefinition('scdsCommitRev', 'SC Delta'),
      getNumberColumnDefinition('scdsCommitRevPrev', 'SC w/w'),
      getNumberColumnDefinition('scbcddsCommitRev', 'SC BCD Delta'),
      getNumberColumnDefinition('scbcddsCommitRevPrev', 'SC BCD w/w'),
    ];
    let commitData;
    if (data.dsCommitRev) {
      commitData = [{
        dsCommitRev: data.dsCommitRev,
        dsCommitRevPrev: data.dsCommitRevPrev,
        bcddsCommitRev: data.bcddsCommitRev,
        bcddsCommitRevPrev: data.bcddsCommitRevPrev,
        scdsCommitRev: data.scdsCommitRev,
        scdsCommitRevPrev: data.scdsCommitRevPrev,
        scbcddsCommitRev: data.scbcddsCommitRev,
        scbcddsCommitRevPrev: data.scbcddsCommitRevPrev,
      }];
    } else {
      commitData = [{
        dsCommitRev: { value: 0 },
        dsCommitRevPrev: { value: 0 },
        bcddsCommitRev: { value: 0 },
        bcddsCommitRevPrev: { value: 0 },
        scdsCommitRev: { value: 0 },
        scdsCommitRevPrev: { value: 0 },
        scbcddsCommitRev: { value: 0 },
        scbcddsCommitRevPrev: { value: 0 },
      }];
    }
    return {
      columnDefs,
      data: commitData,
    };
  };

  this.getSplitLoadColumn = (name, displayName, riskType, period, valueType, prefix, visible, category) =>
    new SplitLoadCurrentWeek(name, displayName, '', riskType, period, valueType, prefix, visible, category).getFieldForUIGrid();
  // Get source data for monthly split tab
  this.getMonthlySplitTable = (data) => {
    const columnDefs = [
      getDollarColumnDefinition('month1revenue', 'M1 Rev'),
      getDollarColumnDefinition('prevm1rev', 'w/w'),
      getDollarColumnDefinition('month2revenue', 'M2 Rev'),
      getDollarColumnDefinition('prevm2rev', 'w/w'),
      getDollarColumnDefinition('month3revenue', 'M3 Rev'),
      getDollarColumnDefinition('prevm3rev', 'w/w'),
      getDollarColumnDefinition('month1cGPAmount', 'M1 cGP$'),
      getDollarColumnDefinition('prevm1cgp', 'w/w'),
      getDollarColumnDefinition('month2cGPAmount', 'M2 cGP$'),
      getDollarColumnDefinition('prevm2cgp', 'w/w'),
      getDollarColumnDefinition('month3cGPAmount', 'M3 cGP$'),
      getDollarColumnDefinition('prevm3cgp', 'w/w'),
    ];
    let commitData;
    if (data.month1) {
      commitData = [{
        month1revenue: data.month1.revenue,
        month2revenue: data.month2.revenue,
        month3revenue: data.month3.revenue,
        prevm1rev: data.month1.prevRevenue,
        prevm2rev: data.month2.prevRevenue,
        prevm3rev: data.month3.prevRevenue,
        month1cGPAmount: data.month1.cGPAmount,
        prevm1cgp: data.month1.prevCGPAmount,
        month2cGPAmount: data.month2.cGPAmount,
        prevm2cgp: data.month2.prevCGPAmount,
        month3cGPAmount: data.month3.cGPAmount,
        prevm3cgp: data.month3.prevCGPAmount,
      }];
    } else {
      commitData = [{
        month1revenue: { value: 0 },
        month2revenue: { value: 0 },
        month3revenue: { value: 0 },
        prevm1rev: { value: 0 },
        prevm2rev: { value: 0 },
        prevm3rev: { value: 0 },
        month1cGPAmount: { value: 0 },
        prevm1cgp: { value: 0 },
        month2cGPAmount: { value: 0 },
        prevm2cgp: { value: 0 },
        month3cGPAmount: { value: 0 },
        prevm3cgp: { value: 0 },
      }];
    }
    return {
      columnDefs,
      data: commitData,
    };
  };

  // Get source data for support tab
  this.getSupportingInfoTable = (data) => {
    const columnDefs = [
      getColumnDefinition('rrApproval', 'Business Unit'),
      getColumnDefinition('country', 'Country'),
      getColumnDefinition('industry', 'Industry'),
      getColumnDefinition('customerNbr', 'Customer No'),
      getColumnDefinition('executionOwner', 'Partner/Exec Owner'),
      getColumnDefinition('projectManager', 'Project Manager'),
      getColumnDefinition('contractStartDate', 'Contract Start', 'date', displayDateFormat),
      getColumnDefinition('contractEndDate', 'Contract End', 'date', displayDateFormat),
      getColumnDefinition('oppyOwner', 'OO'),
      getColumnDefinition('saleStatus', 'Sales Status'),
      getColumnDefinition('actionTaskid', 'Action Task_id'),
      getColumnDefinition('decDate', 'Dec Date', 'date', displayDateFormat),
      getColumnDefinition('tcvLoad', 'TCV'),
      getColumnDefinition('oppy', 'Oppy #'),
    ];
    let commitData;
    if (data.load) {
      commitData = [{
        rrApproval: data.account.buName,
        country: data.account.Attributes.Country,
        industry: data.account.Attributes.Industry,
        customerNbr: data.account.Attributes.Customer_nbr,
        executionOwner: data.load['Execution Owner_load'],
        projectManager: data.load['Project Manager_load'],
        contractStartDate: data.load['Contract Start Date_load'],
        contractEndDate: data.load['Contract End Date_load'],
        oppyOwner: data.load['Oppy Owner_load'],
        saleStatus: data.load['Sales Status_load'],
        actionTaskid: data.load['Action Task_id_load'],
        decDate: data.load['Dec Date_load'],
        tcvLoad: data.load.TCV_load,
        oppy: data.load['Oppy #_load'],
      }];
    } else {
      commitData = [{
        rrApproval: {},
        country: {},
        industry: {},
        customerNbr: {},
        executionOwner: {},
        projectManager: {},
        contractStartDate: {},
        contractEndDate: {},
        oppyOwner: {},
        saleStatus: {},
        actionTaskid: {},
        decDate: {},
        tcvLoad: {},
        oppy: {},
      }];
    }
    return {
      columnDefs,
      data: commitData,
    };
  };

  // Get source data for previous quarter tab
  this.getPrevQtrPerf = (data) => {
    const columnDefs = [
      getDollarColumnDefinition('quarterRevRollOver', 'Revenue'),
      getDollarColumnDefinition('quarterCostRollOver', 'Cost'),
      getDollarColumnDefinition('quarterCGPAmountRollOver', 'cGP$'),
      getPercentColumnDefinition('quarterCGPRollOver', 'cGP%'),

    ];
    let commitData;
    if (data.prevQtrPerformance) {
      commitData = [{
        quarterRevRollOver: data.prevQtrPerformance.revenue,
        quarterCostRollOver: data.prevQtrPerformance.cost,
        quarterCGPRollOver: data.prevQtrPerformance.cGPProcents,
        quarterCGPAmountRollOver: data.prevQtrPerformance.cGPAmount,
      }];
      if (typeof commitData[0].quarterCGPRollOver !== 'undefined') {
        commitData[0].quarterCGPRollOver.value = Number(commitData[0].quarterCGPRollOver.value);
      }
    } else {
      commitData = [{
        quarterRevRollOver: { value: 0 },
        quarterCostRollOver: { value: 0 },
        quarterCGPRollOver: { value: 0 },
        quarterCGPAmountRollOver: { value: 0 },
      }];
    }

    return {
      columnDefs,
      data: commitData,
    };
  };

  this.moreDetails = {
    name: 'More details',
    displayName: '',
    category: 'Key Info',
    width: 43,
    cellTemplate: '<i class="ui-grid-icon-plus-squared" ng-click="grid.appScope.showMoreDetails(row)"></i>',
  };

  this.commitRevenueColumns = [
    'solid.quarter.revenue.value',
    'solid.quarter.prevRevenue.value',
    'risk.quarter.revenue.value',
    'risk.quarter.prevRevenue.value',
  ];

  this.bestCanDoRevenueColumns = [
    'stretch.quarter.revenue.value',
    'stretch.quarter.prevRevenue.value',
  ];

  this.solidRevenue = {
    name: 'solid.quarter.revenue.value',
    displayName: 'o/w Solid',
    category: 'Roadmap Data',
    visible: false,
    width: 120,
    cellTemplate: '<div class="ui-grid-cell-contents">' +
        '<cell-details data="row.entity.solid.quarter.revenue" value="{{row.entity.solid.quarter.revenue.value | number: 3}}" value-sign="" /></div>',
  };
  this.solidPreviousWeekRevenue = {
    name: 'solid.quarter.prevRevenue.value',
    displayName: 'Solid w/w',
    category: 'Roadmap Data',
    visible: false,
    width: 120,
    cellTemplate: '<div class="ui-grid-cell-contents">' +
        '<cell-details data="row.entity.solid.quarter.prevRevenue" value="{{row.entity.solid.quarter.prevRevenue.value | number: 3}}" value-sign="" /></div>',
  };

  this.riskRevenue = {
    name: 'risk.quarter.revenue.value',
    displayName: 'o/w Risk',
    category: 'Roadmap Data',
    visible: false,
    width: 120,
    cellTemplate: '<div class="ui-grid-cell-contents">' +
        '<cell-details data="row.entity.risk.quarter.revenue" value="{{row.entity.risk.quarter.revenue.value | number: 3}}" value-sign="" /></div>',
  };
  this.riskPreviousWeekRevenue = {
    name: 'risk.quarter.prevRevenue.value',
    displayName: 'Risk w/w',
    category: 'Roadmap Data',
    visible: false,
    width: 120,
    cellTemplate: '<div class="ui-grid-cell-contents">' +
        '<cell-details data="row.entity.risk.quarter.prevRevenue " value="{{row.entity.risk.quarter.prevRevenue.value | number: 3}}" value-sign="" /></div>',
  };

  this.stretchRevenue = {
    name: 'stretch.quarter.revenue.value',
    displayName: 'o/w Stretch',
    category: 'Roadmap Data',
    visible: false,
    width: 120,
    cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope">' +
        '<cell-details data="row.entity.stretch.quarter.revenue" value="{{row.entity.stretch.quarter.revenue.value | number: 3}}" value-sign="" /></div>',
  };
  this.stretchPreviousWeekRevenue = {
    name: 'stretch.quarter.prevRevenue.value',
    displayName: 'Stretch w/w',
    category: 'Roadmap Data',
    visible: false,
    width: 120,
    cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope">' +
        '<cell-details data="row.entity.stretch.quarter.prevRevenue" value="{{row.entity.stretch.quarter.prevRevenue.value | number: 3}}" value-sign="" /></div>',
  };

  this.revenueRiskCategories = [
    { name: 'Actuals/Forecast', visible: true, color: '#5596e6', minWidt: 105 },
    { name: 'Actuals/Forecast W/W', visible: true, color: '#5596e6', minWidt: 150 },
    { name: 'Solid', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Solid W/W', visible: true, color: '#5596e6', minWidt: 150 },
    { name: 'Risk', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Risk W/W', visible: true, color: '#5596e6', minWidt: 165 },
    { name: 'Commit', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Commit W/W', visible: true, color: '#5596e6', minWidt: 165 },
    { name: 'Stretch', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Stretch W/W', visible: true, color: '#5596e6', minWidt: 165 },
    { name: 'BCD', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'BCD W/W', visible: true, color: '#5596e6', minWidt: 180 },
  ];

  this.actionsCategories = [
    { name: 'Key Info', visible: true, color: '#5a5a5a', minWidt: 150 },
    { name: 'Action Tracking', visible: true, color: '#5a5a5a', minWidt: 150 },
    { name: '&nbsp;', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Roadmap Data', visible: true, color: '#5596e6', minWidt: 100 },
    { name: 'PQ', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Load Info', visible: true, color: '#5596e6', minWidt: 100 },
    { name: 'PCW', visible: true, color: '#5596e6', minWidt: 90 },
    { name: 'IPPF Data', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'SC Data', visible: true, color: '#5596e6', minWidt: 100 },
    { name: 'Supporting Information', visible: true, color: '#5596e6', minWidt: 160 },
    { name: 'Cognitive Insight', visible: true, color: '#5596e6', minWidt: 160 },
  ];
  this.accountsCategories = [
    { name: 'Key Info', visible: true, color: '#5a5a5a', minWidt: 150 },
    { name: 'Action Tracking', visible: true, color: '#5a5a5a', minWidt: 150 },
    { name: '&nbsp;', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Roadmap Data', visible: true, color: '#5596e6', minWidt: 100 },
    { name: 'PQ', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Load Info', visible: true, color: '#5596e6', minWidt: 100 },
    { name: 'PCW', visible: true, color: '#5596e6', minWidt: 90 },
    { name: 'Q/Q', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Y/Y', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'Financial Goals', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'IPPF Data', visible: true, color: '#5596e6', minWidt: 80 },
    { name: 'SC Data', visible: true, color: '#5596e6', minWidt: 100 },
    { name: 'Supporting Information', visible: true, color: '#5596e6', minWidt: 160 },
    { name: 'Cognitive Insight', visible: true, color: '#5596e6', minWidt: 160 },
  ];

  this.actionsCategories.splice.apply(this.actionsCategories, [4, 0].concat(this.revenueRiskCategories));
  this.accountsCategories.splice.apply(this.accountsCategories, [4, 0].concat(this.revenueRiskCategories));

  this.gridSizes = [
    { name: '3', size: 290 },
    { name: '5', size: 840 }, // 1 row = ~150 - ~143
    { name: '10', size: 1540 },
    { name: '15', size: 2250 },
    { name: '20', size: 2950 },
    { name: '50', size: 7150 },
    { name: 'All', size: -1 },
  ];

  this.source = {
    name: 'source',
    displayName: 'Source',
    category: 'Load Info',
    headerCellClass: 'text-center',
    visible: false,
    width: 100,
    exporterSuppressExport: true,
  };

  this.sourceRev = {
    name: 'sourceRev',
    displayName: 'Delta BCD',
    category: 'Load Info',
    field: 'sourceData.SourceCheckCurrentWeekBestCanDo.QTR_Rev.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    visible: false,
    width: 100,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grig.complex.cell filters="grid.appScope.rowFilters" color="0" obj="QTR" row="row.entity.sourceData.SourceCheckCurrentWeekBestCanDo">',
  };
  this.pcwRev = {
    name: 'pcwRev',
    displayName: 'Identified',
    category: 'PCW',
    headerCellClass: 'text-center',
    visible: false,
    width: 90,
    field: 'pcwRev',
    type: 'number',
    sortingAlgorithm,
    cellTemplate: '<div class="ibp-uigrid-cell">' +
        '<cell-details data="{ value: row.entity.pcwRev }" value="{{row.entity.pcwRev | number: 3}}" value-sign="" /></div>',
  };
  this.pcwPerformed = {
    name: 'pcwPerformed',
    displayName: 'Performed',
    category: 'PCW',
    headerCellClass: 'text-center',
    visible: false,
    width: 100,
    field: 'pcwPerformed',
    type: 'number',
    sortingAlgorithm,
    cellTemplate: '<div class="ibp-uigrid-cell">' +
        '<cell-details data="{value: row.entity.pcwPerformed}" value="{{row.entity.pcwPerformed | number: 3}}" value-sign="" /></div>',
  };
  this.signYieldPCW = {
    name: 'signYieldPCW',
    displayName: 'Yield Delta',
    category: 'PCW',
    headerCellClass: 'text-center',
    visible: false,
    width: 100,
    field: 'signYieldPCW',
    type: 'number',
    sortingAlgorithm,
    cellTemplate: '<div class="ibp-uigrid-cell">' +
        '<cell-details data="{value: row.entity.signYieldPCW}" value="{{row.entity.signYieldPCW | number: 3}}" value-sign="" /></div>',
  };

  // Prev QTR Performance

  this.previousQuarterPerformanceQuarter = {
    name: 'PrevQtrQuarter',
    displayName: 'Actuals',
    columnPrefix: 'Prev QTR',
    field: 'prevQtrPerformance.revenue.value',
    type: 'number',
    sortingAlgorithm,
    category: 'PQ',
    headerCellClass: 'text-center',
    visible: false,
    width: 120,
    exporterSuppressExport: true,
    cellTemplate: '<strong><ui-Grid-Rows filters="grid.appScope.rowFilters" previous="false" row="row.entity.prevQtrPerformance"></ui-Grid-Rows></strong>',
  };

  this.previousQuarterToQuarterCommit = {
    name: 'PrevQtrToQuarterValueCommit',
    displayName: 'Commit',
    columnPrefix: 'Q/Q Commit',
    category: 'Q/Q',
    field: 'previousQuarterValuesCommit.revenue.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    visible: false,
    width: 80,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grid.complex.evaluated.cell filters="grid.appScope.rowFilters" color="1" data="row.entity.previousQuarterValuesCommit"></ui.grid.complex.evaluated.cell>',
  };

  this.previousQuarterToQuarterBestCanDo = {
    name: 'PrevQtrToQuarterValueBestCanDo',
    displayName: 'BCD',
    columnPrefix: 'Q/Q Best Can Do',
    category: 'Q/Q',
    field: 'previousQuarterValuesBestCanDo.revenue.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    visible: false,
    width: 80,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grid.complex.evaluated.cell filters="grid.appScope.rowFilters" color="1" data="row.entity.previousQuarterValuesBestCanDo"></ui.grid.complex.evaluated.cell>',
  };

  this.previousYearToYearCommit = {
    name: 'PrevYearToYearValueCommit',
    displayName: 'Commit',
    columnPrefix: 'Y/Y Commit',
    field: 'previousYearValuesCommit.revenue.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Y/Y',
    visible: false,
    width: 80,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grid.complex.evaluated.cell filters="grid.appScope.rowFilters" color="1" data="row.entity.previousYearValuesCommit"></ui.grid.complex.evaluated.cell>',
  };

  this.previousYearToYearBestCanDo = {
    name: 'PrevYearToYearValueBestCanDo',
    displayName: 'BCD',
    columnPrefix: 'Y/Y Best Can Do',
    field: 'previousYearValuesBestCanDo.revenue.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Y/Y',
    visible: false,
    width: 80,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grid.complex.evaluated.cell filters="grid.appScope.rowFilters" color="1" data="row.entity.previousYearValuesBestCanDo"></ui.grid.complex.evaluated.cell>',
  };

  this.financialGoalBestCanDo = {
    name: 'FinancialGoalBestCanDo',
    displayName: 'Target',
    columnPrefix: 'Fin Goals Best Can Do',
    field: 'financialGoalBestCanDo.revenue.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Financial Goals',
    visible: false,
    width: 80,
    exporterSuppressExport: true,
    
    cellTemplate: '<ui.grid.complex.evaluated.cell color="0" filters="grid.appScope.rowFilters" color="1" data="row.entity.financialGoalBestCanDo"></ui.grid.complex.evaluated.cell>',
  };

  this.financialGoalDelta = {
    name: 'financialGoalDelta',
    displayName: 'B/W Target',
    columnPrefix: 'Fin Goals Delta vs BCD',
    field: 'financialGoalDelta.revenue.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Financial Goals',
    visible: false,
    width: 90,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grid.complex.evaluated.cell filters="grid.appScope.rowFilters" color="1" data="row.entity.financialGoalDelta"></ui.grid.complex.evaluated.cell>',
  };

  this.revenueRollOver = {
    name: 'revenueRollOver',
    displayName: 'Rev',
    columnPrefix: 'Prev QTR',
    category: 'Prev QTR Performance',
    visible: false,
    field: 'quarter.revenueRollOver.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    width: 133,
    cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope">' +
        '<cell-details data="row.entity.quarter.revenueRollOver" value="{{row.entity.quarter.revenueRollOver.value | number: 3}}" value-sign="" /></div>',
  };
  this.costRollOver = {
    name: 'costRollOver',
    displayName: 'Cost',
    columnPrefix: 'Prev QTR',
    category: 'Prev QTR Performance',
    field: 'row.entity.quarter.costRollOver.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    visible: false,
    width: 133,
    cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope">' +
        '<cell-details data="row.entity.quarter.costRollOver" value="{{row.entity.quarter.costRollOver.value | number: 3}}" value-sign="" /></div>',
  };
  this.cGPProcentsRollOver = {
    name: 'cGPProcentsRollOver',
    displayName: 'cGP%',
    columnPrefix: 'Prev QTR',
    category: 'Prev QTR Performance',
    field: 'row.entity.quarter.cGPProcentsRollOver.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    visible: false,
    width: 133,
    cellTemplate: '<div class="ui-grid-cell-contents ng-binding ng-scope">' +
        '<cell-details data="row.entity.quarter.cGPProcentsRollOver" value="{{row.entity.quarter.cGPProcentsRollOver.value*100 | number: 1}}" value-sign="%" /></div>',
  };

  // IPPF Data

  this.dsCommitRev = {
    name: 'dsCommitRev',
    displayName: 'Backlog',
    field: 'sourceData.LoadIPPFCurrentWeekBestCanDo.QTR_Rev.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    columnPrefix: 'IPPF',
    category: 'Load Info',
    visible: false,
    width: 100,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grig.complex.cell filters="grid.appScope.rowFilters" color="0" obj="QTR" row="row.entity.sourceData.LoadIPPFCurrentWeekBestCanDo"></ui.grig.complex.cell>',
  };
  this.dsCommitRevPrev = {
    name: 'dsCommitRevPrev',
    displayName: 'Backlog w/w',
    field: 'sourceData.LoadIPPFDeltatoprevWkBestCanDo.QTR_Rev.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    columnPrefix: 'IPPF',
    enabledByW2W: true,
    category: 'Load Info',
    visible: false,
    width: 100,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grig.complex.cell filters="grid.appScope.rowFilters" color="0" obj="QTR" row="row.entity.sourceData.LoadIPPFDeltatoprevWkBestCanDo"></ui.grig.complex.cell>',
  };

  this.dsQtrBacklogRemainRevenue = {
    name: 'dsQtrBacklogRemainRevenue',
    displayName: 'Remain Backlog Rev',
    field: 'set_1.QTR Backlog Remain Rev',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Supporting Information',
    visible: false,
    width: 185,
    cellTemplate: '<div class="ibp-uigrid-cell ng-binding ng-scope">' +
        '<cell-details data="row.entity.set_1[\'QTR Backlog Remain Rev\']" value="{{row.entity.set_1[\'QTR Backlog Remain Rev\'] | number: 3}}" value-sign="" /></div>',
  };
  this.dsQtrPlanRevenue = {
    name: 'dsQtrPlanRevenue',
    displayName: 'Planned Rev',
    field: 'set_1.QTR Plan Rev',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Supporting Information',
    visible: false,
    width: 185,
    cellTemplate: '<div class="ibp-uigrid-cell ng-binding ng-scope">' +
        '<cell-details data="row.entity.set_1[\'QTR Plan Rev\']" value="{{row.entity.set_1[\'QTR Plan Rev\'] | number: 3}}" value-sign="" /></div>',
  };
  this.dsQtrITDRevenue = {
    name: 'dsQtrITDRevenue',
    displayName: 'ITD Rev',
    field: 'set_1.QTR ITD Rev',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    category: 'Supporting Information',
    visible: false,
    width: 185,
    cellTemplate: '<div class="ibp-uigrid-cell ng-binding ng-scope">' +
        '<cell-details data="row.entity.set_1[\'QTR ITD Rev\']" value="{{row.entity.set_1[\'QTR ITD Rev\'] | number: 3}}" value-sign="" /></div>',
  };

  // SC Data

  this.scdsCommitRev = {
    name: 'scdsCommitRev',
    displayName: 'Oppy',
    field: 'sourceData.LoadSCCurrentWeekBestCanDo.QTR_Rev.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    columnPrefix: 'SC',
    category: 'Load Info',
    visible: false,
    width: 100,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grig.complex.cell filters="grid.appScope.rowFilters" color="0" obj="QTR" row="row.entity.sourceData.LoadSCCurrentWeekBestCanDo"></ui.grig.complex.cell>',
  };
  this.scdsCommitRevPrev = {
    name: 'scdsCommitRevPrev',
    displayName: 'Oppy w/w',
    field: 'sourceData.LoadSCDeltatoprevWkBestCanDo.QTR_Rev.value',
    type: 'number',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    columnPrefix: 'SC',
    enabledByW2W: true,
    category: 'Load Info',
    visible: false,
    width: 100,
    exporterSuppressExport: true,
    cellTemplate: '<ui.grig.complex.cell filters="grid.appScope.rowFilters" color="0" obj="QTR" row="row.entity.sourceData.LoadSCDeltatoprevWkBestCanDo"></ui.grig.complex.cell>',
  };

  // Supporting information
  this.parentBusinessUnit = { // This collumn is only available under coverageID
    name: 'Parent Business Unit', field: 'approval.Parent.buName', displayName: 'Parent Unit', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 140,
  };
  this.projectRRApproval = {
    name: 'Business Unit', field: 'account.buName', displayName: 'Business Unit', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 133,
  };

  this.projectCountry = {
    name: 'account.Attributes.Country', field: 'account.Attributes.Country', displayName: 'Country', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 133,
  };
  this.projectIndustry = {
    name: 'account.Attributes.Industry', field: 'account.Attributes.Industry', displayName: 'Industry', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 133,

  };

  this.projectCustomerNbr = {
    name: 'account.Attributes.Customer_nbr', field: 'account.Attributes.Customer_nbr', displayName: 'Customer #', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 133,
  };

  this.tcvLoad = {
    name: 'load.TCV_Load',
    field: 'load.TCV_load',
    displayName: 'TCV',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    visible: false,
    width: 120,
    type: 'number',
    sortingAlgorithm,
    cellTemplate: '<div class="ibp-uigrid-cell ng-binding ng-scope">' +
        '<cell-details data="row.entity.load.TCV_load" value="{{row.entity.load.TCV_load | number: 3}}" value-sign="" /></div>',
  };

  // Load information
  this.projectExecutionOwner = {
    name: 'load.Execution Owner_load', field: 'load.Execution Owner_load', displayName: 'Partner/Exec Owner', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 163,
  };
  this.projectProjectManager = {
    name: 'load.Project Manager_load', displayName: 'Project Manager', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 143,
  };
  this.projectContractEndDate = {
    name: 'load.Contract End Date_load',
    displayName: 'Contract End',
    sortingAlgorithm,
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    visible: false,
    width: 120,
    type: 'date',
    cellTemplate: `${'<div class="ui-grid-cell-contents">' +
        '{{row.entity.load[\'Contract End Date_load\'] | formatField:\'date\':\''}${displayDateFormat}'}}</div>`,
  };
  this.projectContractStartDate = {
    name: 'load.Contract Start Date_load',
    displayName: 'Contract Start',
    category: 'Supporting Information',
    sortingAlgorithm,
    headerCellClass: 'text-center',
    visible: false,
    width: 120,
    type: 'number',
    cellTemplate: `${'<div class="ui-grid-cell-contents">' +
        '{{row.entity.load[\'Contract Start Date_load\'] | formatField:\'date\':\''}${displayDateFormat}'}}</div>`,
  };
  this.projectOppyOwner = {
    name: 'load.Oppy Owner_load', displayName: 'OO', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 133,
  };
  this.LineItemOwner = {
    name: 'Line Item Owner_load',
    displayName: 'Line Item Owner',
    category: 'Supporting Information',
    visible: false,
    headerCellClass: 'text-center',
    width: 133,
    field: 'load.Line Item Owner_load',
  };
  this.projectSaleStatus = {
    name: 'load.Sales Status_load', displayName: 'Sales Status', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 110,
  };
  this.projectSaleStage = {
    name: 'load.Sales Stage_load',
    displayName: 'Sales Stage',
    category: 'Supporting Information',
    visible: false,
    headerCellClass: 'text-center',
    width: 184,
  };
  this.projectDecDate = {
    name: 'load.Dec Date_load',
    displayName: 'Dec Date',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    sortingAlgorithm,
    visible: false,
    width: 133,
    cellTemplate: `${'<div class="ui-grid-cell-contents">' +
        '{{row.entity.load[\'Dec Date_load\'] | formatField:\'date\':\''}${displayDateFormat}'}}</div>`,
  };

  this.showEditIcon = {
    headerCellClass: 'text-center',
    name: 'showEditIcon',
    displayName: '',
    field: '',
    category: 'Key Info',
    visible: true,
    width: 30,
    cellTemplate:
    `<div class="ui-grid-cell-contents">
      <div ng-click="grid.appScope.changeToContract($event, row)"
        ng-show="grid.appScope.selectedView === 'account' || grid.appScope.selectedView === 'opportunity'"
        ng-class="{'icon-ibp-edit': grid.appScope.isAccountDefined(row) && grid.appScope.isAccountViewableOrEditable(), 'icon-ibp-eyey': grid.appScope.isAccountDefined(row) && !grid.appScope.isAccountViewableOrEditable()}"
        class="accounts-to-contract-drill-in-btn"
        ng-attr-title="{{grid.appScope.getAccountCellTitle()}}">
      </div>
    </div>`,
  };

  this.accountName = {
    headerCellClass: 'text-center',
    name: 'Account Name',
    displayName: 'Account Name',
    field: 'account.Attributes.Account Name',
    category: 'Key Info',
    visible: true,
    width: 123,
    sort: {
      direction: uiGridConstants.ASC,
      priority: 0,
    },
  };

  if (UserSettingsService.getRegion() === 'EU-GTS') {
    this.accountName.cellTemplate = `<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.account.Attributes[\'Long Name\']}}" tooltip-append-to-body="true">
          {{row.entity.account.Attributes[\'Application Name\']}}
    </span></div>`;
    this.accountName.field = 'account.Attributes.Application Name';
  }
  this.cadenceComment = {
    headerCellClass: 'text-center',
    name: 'Cadence Comment',
    displayName: 'Cadence Comment',
    field: 'account.hasCadenceComment',
    category: 'Key Info',
    visible: true,
    width: 150,
    cellTemplate: '<span ng-if="row.entity.account.hasCadenceComment"><cadence-popover node="row.entity.account.Name"/></span>',
  };


  if (UserSettingsService.getRegion() === 'EU-GTS') {
    this.cadenceComment.cellTemplate = '<span ng-if="row.entity.account.hasCadenceComment"><cadence-popover node="row.entity.account.Attributes[\'Application Name\']"/></span>';
  }

  this.longName = {
    headerCellClass: 'text-center',
    name: 'GTSWW alias',
    displayName: 'GTSWW alias',
    field: 'account.Attributes.Long Name',
    category: 'Key Info',
    visible: false,
    width: 123,
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.account.Attributes[\'Long Name\']}}" tooltip-append-to-body="true">{{row.entity.account.Attributes[\'Long Name\']}}</span></div>',
  };

  this.customerName = {
    name: 'Customer Name', displayName: 'Customer Name', field: 'account.Attributes.Customer Name', category: 'Key Info', headerCellClass: 'text-center', visible: true, width: 133,
  };
  this.coverageId = {
    name: 'Coverage ID', displayName: 'Coverage ID', field: 'load.Coverage Id_load', category: 'Key Info', headerCellClass: 'text-center', visible: true, width: 133, sortingAlgorithm,
  };

  this.profitCenter = {
    name: 'Profit Center', displayName: 'Profit Center', field: 'load.Profit Center_load', category: 'Supporting Information', visible: false, headerCellClass: 'text-center', width: 110,
  };

  this.cognitiveRank = {
    name: 'Rank',
    displayName: 'Rank',
    field: 'account.Attributes.Cognitive Rank',
    category: 'Cognitive Insight',
    headerCellClass: 'text-center',
    width: 110,
    sortingAlgorithmForText,
    visible: false,
  };

  this.cognitiveRankReasoning = {
    name: 'Revenue Insight',
    displayName: 'Revenue Insight',
    field: 'account.Attributes.Cognitive Rank Reasoning',
    category: 'Cognitive Insight',
    headerCellClass: 'text-center',
    width: 180,
    sortingAlgorithmForText,
    visible: false,
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.account.Attributes[\'Cognitive Rank Reasoning\'].split(\';\').join(\'&#013;&#010;\')}}" tooltip-append-to-body="true">{{row.entity.account.Attributes[\'Cognitive Rank Reasoning\']}}</span></div>',
  };
    this.cognitiveClaimFlagReasoning = {
    name: 'Cognitive Insight',
    displayName: 'Claiming Insight',
    field: 'account.Attributes.Cognitive Claim Flag Reasoning',
    category: 'Cognitive Insight',
    headerCellClass: 'text-center',
    width: 220,
    sortingAlgorithmForText,
    visible: false,
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.account.Attributes[\'Cognitive Claim Flag Reasoning\'].split(\';\').join(\'&#013;&#010;\')}}" tooltip-append-to-body="true">{{row.entity.account.Attributes[\'Cognitive Claim Flag Reasoning\']}}</span></div>',
  };
  if (application === 'Europe') {
    this.coverageId.field = 'account.Parent.Attributes.Coverage ID';
    this.coverageId.category = 'Supporting Information';
    this.coverageId.visible = false;
  }

  this.coverageName = {
    name: 'Coverage Name', displayName: 'Coverage Name', field: 'account.Parent.Attributes.Coverage Name', category: 'Supporting Information', headerCellClass: 'text-center', visible: false, width: 133,
  };
  this.coverageType = {
    name: 'Coverage Type', displayName: 'Coverage Type', field: 'account.Parent.Attributes.Coverage Type', category: 'Supporting Information', headerCellClass: 'text-center', visible: false, width: 133,
  };
  this.roadmapStatus = {
    name: 'load.Roadmap Status_load', displayName: 'SC Status', category: 'Key Info', headerCellClass: 'text-center', visible: false, width: 143,
  };
 
  this.contractNumber = {
    name: 'Oppt/Work ID',
    field: 'account.Name',
    category: 'Key Info',
    headerCellClass: 'text-center',
    visible: true,
    sortingAlgorithm,
    width: 133,
    displayName: 'Source ID',
    cellTemplate: '<div class="ui-grid-cell-contents" ng-hide="row.entity.account.Attributes[\'Is Account\'] === \'Y\'">{{ row.entity.account.Name }}</div>',
  };
  this.contract = { name: 'Contract #_load', field: 'account.Attributes.Contract', category: 'Key Info', headerCellClass: 'text-center', visible: true, width: 133, displayName: 'Contract Number' };
  this.wbsLevel = { name: 'WBS Level', field: 'account.Attributes.WBS Level', category: 'Key Info', headerCellClass: 'text-center', visible: true, width: 133, displayName: 'WBS Level' };
  this.legalNumber = { name: 'Legal Contract Number', field: 'load.Legal Contract Number_load', displayName: 'Legal #', category: 'Key Info', headerCellClass: 'text-center', visible: false, width: 100, sortingAlgorithmForText };
  this.clusterName = { name: 'Cluster', field: 'set_1.Cluster Name', displayName: 'Cluster', category: 'Key Info', headerCellClass: 'text-center', visible: false, width: 133 };
  this.roadmapItemType = { 
    name: 'load.Roadmap Item Type_load', 
    field: CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true ? 'roadmapItemType.Name' : 'load.Roadmap Item Type_load', 
    category: 'Key Info', 
    headerCellClass: 'text-center', 
    visible: true, 
    displayName: 'Roadmap', 
    width: 78 
  };
  this.oppDescr = {
    name: 'Opp Descr',
    field: 'account.Attributes.Opp Descr',
    category: 'Key Info',
    headerCellClass: 'text-center',
    visible: true,
    displayName: 'Info',
    width: 60,
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.account.Attributes[\'Opp Descr\']}}" tooltip-append-to-body="true">{{row.entity.account.Attributes[\'Opp Descr\']}}</span></div>',

  };
  this.serviceLine = { name: 'Service line', field: 'serviceLine.Name', category: 'Key Info', headerCellClass: 'text-center', visible: false, displayName: 'SL', width: 78 };

  if (application === 'North America (GBS)') {
    this.serviceLine.field = 'serviceLine.slName';
  }

  this.practise = { name: 'Practise', field: 'serviceLine.practiceName', category: 'Key Info', headerCellClass: 'text-center', visible: false, displayName: 'Practise', width: 123 };

  this.affiliates = { name: 'Affiliates', field: 'account.Attributes.Affiliates', category: 'Key Info', headerCellClass: 'text-center', visible: false, displayName: 'Affiliates', width: 102 };

  const headerTypeTemplate = $templateCache.get('components/accounts/ui-grid-header-extras/headerCell-type-template.html');

  this.type = {
    name: 'Type',
    displayName: 'Type',
    category: '&nbsp;',
    headerCellClass: 'text-center',
    visible: true,
    width: 65,
    enableSorting: false,
    exporterSuppressExport: true,
    headerCellTemplate: headerTypeTemplate,
    canDisableRows: true,
    cellTemplate: '<type.dummy.cell filters="grid.appScope.rowFilters"></type.dummy.cell>',
  };

  this.Priority = {
    name: 'action.Priority',
    displayName: 'Priority',
    field: 'action.Priority',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    width: 110,
    sortingAlgorithm: (a, b, rowA, rowB, direction) => {
      const valuesInOrder = ['low', 'medium', 'high']; 
      return getPriority(a, valuesInOrder, direction) - getPriority(b, valuesInOrder, direction);  
    },
    visible: false,
  };
  this.Probability = {
    name: 'action.Probability',
    displayName: 'Probability',
    field: 'action.Probability',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    width: 110,
    sortingAlgorithm: (a, b, rowA, rowB, direction) => {
      const valuesInOrder = ['low', 'medium', 'high']; 
      return getPriority(a, valuesInOrder, direction) - getPriority(b, valuesInOrder, direction);  
    },
    visible: false,
  };

  this.ragIppf = {
    name: 'load.RAG',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    visible: false,
    width: 60,
    displayName: 'RAG',
    cellTemplate: '<div class="ui-grid-cell-contents"><com.ibm.ibp.accounts.rag value="row.entity.action.RAG"></com.ibm.ibp.accounts.rag></div>',
    sortingAlgorithm: (a, b, rowA, rowB, direction) => {
      const valuesInOrder = ['green', 'yellow', 'orange', 'red']; 
      return getPriority(a, valuesInOrder, direction) - getPriority(b, valuesInOrder, direction);  
    },
  };
  if (UserSettingsService.isEuGtsRegion()) {
    this.ragIppf.displayName = 'RAG from IPPF'
  }

  this.RoadmapClass = {
    name: 'action.Roadmap Class',
    displayName: 'Roadmap Class',
    field: 'action[\'Roadmap Class\']',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    width: 110,
    sortingAlgorithm: (a, b, rowA, rowB, direction) => {
      const valuesInOrder = ['downside', 'upside']; 
      return getPriority(a, valuesInOrder, direction) - getPriority(b, valuesInOrder, direction);  
    },
    visible: false,
  };

  // Bset Can do columns

  this.bestCanDoMonth1 = new BestCanDoCurrentWeekField('bestCanDo Month 1', 'M1', 'M1').getFieldForUIGrid();
  this.bestCanDoMonth2 = new BestCanDoCurrentWeekField('bestCanDo Month 2', 'M2', 'M2').getFieldForUIGrid();
  this.bestCanDoMonth3 = new BestCanDoCurrentWeekField('bestCanDo Month 3', 'M3', 'M3').getFieldForUIGrid();
  this.bestCanDoMonth1plus2 = new BestCanDoCurrentWeekField('bestCanDo Month 1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.bestCanDoQuarter = new BestCanDoCurrentWeekField('bestCanDo Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.bestCanDopreviousMonth1_ww = new BestCanDoPrevWeekField('bestCanDo ww Month_1', 'M1', 'M1').getFieldForUIGrid();
  this.bestCanDopreviousMonth2_ww = new BestCanDoPrevWeekField('bestCanDo ww Month_2', 'M2', 'M2').getFieldForUIGrid();
  this.bestCanDopreviousMonth3_ww = new BestCanDoPrevWeekField('bestCanDo ww Month_3', 'M3', 'M3').getFieldForUIGrid();
  this.bestCanDopreviousMonth1plus2_ww = new BestCanDoPrevWeekField('bestCanDo ww Month_1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.bestCanDopreviousQuarter_ww = new BestCanDoPrevWeekField('bestCanDo ww Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  // Solid Can do columns

  this.month1 = new CommitCurrentWeekField('Commit Month1', 'M1', 'M1').getFieldForUIGrid();
  this.month2 = new CommitCurrentWeekField('Commit Month2', 'M2', 'M2').getFieldForUIGrid();
  this.month1plus2 = new CommitCurrentWeekField('Commit Month 1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.month3 = new CommitCurrentWeekField('Commit Month3', 'M3', 'M3').getFieldForUIGrid();
  this.quarter = new CommitCurrentWeekField('Commit Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.riskMonth1 = new RiskCurrentWeekField('Risk Month1', 'M1', 'M1').getFieldForUIGrid();
  this.riskMonth2 = new RiskCurrentWeekField('Risk Month2', 'M2', 'M2').getFieldForUIGrid();
  this.riskMonth1plus2 = new RiskCurrentWeekField('Risk Month 1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.riskMonth3 = new RiskCurrentWeekField('Risk Month3', 'M3', 'M3').getFieldForUIGrid();
  this.riskQuarter = new RiskCurrentWeekField('Risk Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.solidMonth1 = new SolidCurrentWeekField('Solid Month1', 'M1', 'M1').getFieldForUIGrid();
  this.solidMonth2 = new SolidCurrentWeekField('Solid Month2', 'M2', 'M2').getFieldForUIGrid();
  this.solidMonth1plus2 = new SolidCurrentWeekField('Solid Month 1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.solidMonth3 = new SolidCurrentWeekField('Solid Month3', 'M3', 'M3').getFieldForUIGrid();
  this.solidQuarter = new SolidCurrentWeekField('Solid Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.solidTargetIOTMonth1 = new Solid1TargetIOTCurrentWeek('Target IOT Month1', 'M1', 'M1').getFieldForUIGrid();
  this.solidTargetIOTMonth2 = new Solid1TargetIOTCurrentWeek('Target IOT Month2', 'M2', 'M2').getFieldForUIGrid();
  this.solidTargetIOTMonth3 = new Solid1TargetIOTCurrentWeek('Target IOT Month3', 'M3', 'M3').getFieldForUIGrid();
  this.solidTargetIOTQuarter = new Solid1TargetIOTCurrentWeek('Target IOT Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.solidTargetIMTMonth1 = new Solid1TargetIMTCurrentWeek('Target IMT Month1', 'M1', 'M1').getFieldForUIGrid();
  this.solidTargetIMTMonth2 = new Solid1TargetIMTCurrentWeek('Target IMT Month2', 'M2', 'M2').getFieldForUIGrid();
  this.solidTargetIMTMonth3 = new Solid1TargetIMTCurrentWeek('Target IMT Month3', 'M3', 'M3').getFieldForUIGrid();
  this.solidTargetIMTQuarter = new Solid1TargetIMTCurrentWeek('Target IMT Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.stretchMonth1 = new StretchCurrentWeekField('Stretch Month1', 'M1', 'M1').getFieldForUIGrid();
  this.stretchMonth2 = new StretchCurrentWeekField('Stretch Month2', 'M2', 'M2').getFieldForUIGrid();
  this.stretchMonth1plus2 = new StretchCurrentWeekField('Stretch Month 1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.stretchMonth3 = new StretchCurrentWeekField('Stretch Month3', 'M3', 'M3').getFieldForUIGrid();
  this.stretchQuarter = new StretchCurrentWeekField('Stretch Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  // Solid W/W
  this.solidPreviousMonth1_ww = new SolidPrevWeekField('Solid ww Month_1', 'M1', 'M1').getFieldForUIGrid();
  this.solidPreviousMonth2_ww = new SolidPrevWeekField('Solid ww Month_2', 'M2', 'M2').getFieldForUIGrid();
  this.solidPreviousMonth3_ww = new SolidPrevWeekField('Solid ww Month_3', 'M3', 'M3').getFieldForUIGrid();
  this.solidPreviousMonth1plus2_ww = new SolidPrevWeekField('Solid ww Month_1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.solidPreviousQuarter_ww = new SolidPrevWeekField('Solid ww Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.riskPreviousMonth1_ww = new RiskPrevWeekField('Risk ww Month_1', 'M1', 'M1').getFieldForUIGrid();
  this.riskPreviousMonth2_ww = new RiskPrevWeekField('Risk ww Month_2', 'M2', 'M2').getFieldForUIGrid();
  this.riskPreviousMonth3_ww = new RiskPrevWeekField('Risk ww Month_3', 'M3', 'M3').getFieldForUIGrid();
  this.riskPreviousMonth1plus2_ww = new RiskPrevWeekField('Risk ww Month_1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.riskPreviousQuarter_ww = new RiskPrevWeekField('risk ww Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.stretchPreviousMonth1_ww = new StretchPrevWeekField('Stretch ww Month_1', 'M1', 'M1').getFieldForUIGrid();
  this.stretchPreviousMonth2_ww = new StretchPrevWeekField('Stretch ww Month_2', 'M2', 'M2').getFieldForUIGrid();
  this.stretchPreviousMonth3_ww = new StretchPrevWeekField('Stretch ww Month_3', 'M3', 'M3').getFieldForUIGrid();
  this.stretchPreviousMonth1plus2_ww = new StretchPrevWeekField('Stretch ww Month_1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.stretchPreviousQuarter_ww = new StretchPrevWeekField('Stretch ww Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.previousMonth1 = new CommitPrevWeekField('Month_1', 'M1', 'M1').getFieldForUIGrid();
  this.previousMonth2 = new CommitPrevWeekField('Month_2', 'M2', 'M2').getFieldForUIGrid();
  this.previousMonth3 = new CommitPrevWeekField('Month_3', 'M3', 'M3').getFieldForUIGrid();
  this.previousMonth1plus2 = new CommitPrevWeekField('Month_1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.previousQuarter = new CommitPrevWeekField('Quarter_', 'Qtr', 'QTR').getFieldForUIGrid();

  // Base forecast
  // Solid Can do columns

  this.solid1Month1 = new BaseCurrentWeekField('Forecast Month 1', 'M1', 'M1').getFieldForUIGrid();
  this.solid1Month2 = new BaseCurrentWeekField('Forecast Month 2', 'M2', 'M2').getFieldForUIGrid();
  this.solid1Month3 = new BaseCurrentWeekField('Forecast Month 3', 'M3', 'M3').getFieldForUIGrid();
  this.solid1Month1plus2 = new BaseCurrentWeekField('Forecast Month 1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.solid1Quarter = new BaseCurrentWeekField('Forecast Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  this.solid1PreviousMonth1_ww = new BasePrevWeekField('Forecast ww Month_1', 'M1', 'M1').getFieldForUIGrid();
  this.solid1PreviousMonth2_ww = new BasePrevWeekField('Forecast ww Month_2', 'M2', 'M2').getFieldForUIGrid();
  this.solid1PreviousMonth3_ww = new BasePrevWeekField('Forecast ww Month_3', 'M3', 'M3').getFieldForUIGrid();
  this.solid1PreviousMonth1plus2_ww = new BasePrevWeekField('Forecast ww Month_1plus2', 'M1+M2', 'M1_M2').getFieldForUIGrid();
  this.solid1PreviousQuarter_ww = new BasePrevWeekField('Forecast ww Quarter', 'Qtr', 'QTR').getFieldForUIGrid();

  // Actions RDM specific
  this.Comment = {
    name: 'action.Action Comment',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 100,
    displayName: 'Comment',
    field: 'action.Action Comment',
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.action[\'Action Comment\']}}" tooltip-append-to-body="true">{{row.entity.action[\'Action Comment\']}}</span></div>',
  };

  // Action comment for contracts roadmap
  this.ContractsComment = {
    name: 'set_1.Action Comment',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    visible: false,
    width: 100,
    displayName: 'Comment',
    field: 'set_1.Action Comment',
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.set_1[\'Action Comment\']}}" tooltip-append-to-body="true">{{row.entity.set_1[\'Action Comment\']}}</span></div>',
  };
  this.RichComment = {
    name: 'action.Comment',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 200,
    displayName: 'Rich Comment',
    field: 'action.Comment',
    cellTemplate: '<div class="ui-grid-cell-contents"><span class="comment-cell inline-icon-container" uib-popover-html="row.entity.action.Comment" popover-append-to-body="true" popover-trigger="\'mouseenter\'" popover-class="cadence-comment comment-modal-popover">{{row.entity.action[\'Comment\'] | stripTags}}<span class="icon-inline-edit icon-ibp-edit" ng-click="grid.appScope.openComment(row.entity, true, null, true)"></span></span></div>',
  };
 
  this.Owner = {
    name: 'action.Action Owner', category: 'Action Tracking', headerCellClass: 'text-center', visible: true, width: 85, displayName: 'Owner',
  };

  this.DueDate = {
    name: 'action.Action Due Date',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 85,
    displayName: 'Due',
    sortingAlgorithm,
    // cellFilter: 'date:\'dd.MM.yyyy\'',
    cellTemplate: `${'<div class="ui-grid-cell-contents">' +
        '{{row.entity.action[\'Action Due Date\'] | formatField:\'date\':\''}${displayDateFormat}'}}</div>`,
  };
  this.Review = {
    name: 'action.Review',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 200,
    displayName: 'Review',
    cellTemplate: '<review-select show-edit-icon="true" data="row.entity.action.Review" entity="row.entity" is-split="true"></review-select>',

  };
  this.RAG = {
    name: 'action.RAG_load',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 60,
    displayName: 'RAG',
    cellTemplate: '<div class="ui-grid-cell-contents"><com.ibm.ibp.accounts.rag show-edit-icon="true" value="row.entity.action.RAG_load" entity="row.entity"></com.ibm.ibp.accounts.rag></div>',
    sortingAlgorithm: (a, b, rowA, rowB, direction) => {
      if (a === 'G' && (b === 'A' || b === 'R')) return 1;
      if (a === 'A' && b === 'R') return 1;
      if (a === 'A' && b === 'G') return -1;
      if (a === 'R' && (b === 'G' || b === 'A')) return -1;
      if (direction === 'desc') { // No values should always be at the bottom
        if (a && !b) return 1; // !b for undefined or null
        if (!a && b) return -1;
      } else {
        if (a && !b) return -1;
        if (!a && b) return 1;
      }
      return 0;
    },
  };
  this.ActionTaskid = {
    name: 'action.Action Task_id',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 100,
    displayName: 'Task/Oppty line',
    field: 'action.Action Task_id',
    // cellTemplate: '<div class="ui-grid-cell-contents"><span class="comm-cell" tooltip-placement="top-left" uib-tooltip="{{row.entity.action[\'Action Task_id\']}}" tooltip-append-to-body="true">{{row.entity.action[\'Action Task_id\']}}</span></div>',
  };
  this.RevenueRiskCategory = {
    name: 'revenueRiskCategory',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    visible: true,
    width: 90,
    displayName: 'Risk',
    field: 'revenueRiskCategory.Name',
    cellTemplate: '<div class="ui-grid-cell-contents" ' +
        'title="{{ row.entity.revenueRiskCategory.Name }}">{{ row.entity.revenueRiskCategory.Name.split(\' \')[0] }}</div>',
  };

  this.oppy = {
    name: 'load.Oppy #_load',
    field: 'load.Oppy #_load',
    displayName: 'Oppy #',
    category: 'Supporting Information',
    headerCellClass: 'text-center',
    visible: false,
    width: 110,
  };

  this.valueCategory = {
    name: 'valueCategory',
    category: 'Action Tracking',
    headerCellClass: 'text-center',
    field: 'action.Rev Value Category',
    visible: true,
    width: 135,
    displayName: 'Value Category',
    sortingAlgorithmForText,
    // cellFilter: 'date:\'dd.MM.yyyy\'',
    cellTemplate: `<ui.grig.category.cell filters="grid.appScope.rowFilters" row="row.entity.action"></ui.grig.category.cell>`,
  };

  this.filterColumns = [
    this.accountName.name,
    this.roadmapItemType.name,
    this.serviceLine.name,
    this.legalNumber.name,
    this.contractNumber.name,
    this.projectSaleStatus.name,
    this.affiliates.name,
    
  ];

  this.sourceDataCategories = [
    'Roadmap Data',
    'Load Info',
    'PCW',
    'Prev QTR Performance',
    'IPPF Data',
    'SC Data',
  ];

  this.solidRiskDataCategories = [
    'Solid',
    'Solid W/W',
    'Risk',
    'Risk W/W',
  ];

  this.solid1StretchDataCategories = [
    'Stretch',
    'Stretch W/W',
    'Actuals/Forecast',
    'Actuals/Forecast W/W',
  ];


  this.exporterFieldCallback = (grid, row, col, input) => {
    if (col.displayName === 'Risk') {
      if (typeof row.entity.revenueRiskCategory === 'undefined') {
        return '';
      }

      return row.entity.revenueRiskCategory.Name;
    } else if (col.name === 'dsCommitRev') {
      if (row.entity.sourceData) {
        if (grid.appScope.viewCommitPopover.getActive() === 'Commit') {
          return row.entity.sourceData.commit.ippfData.quarter.revenue.value;
        }
        return row.entity.sourceData.bestCanDo.ippfData.quarter.revenue.value;
      }
      return input;
    } else if (col.name === 'dsCommitRevPrev') {
      if (row.entity.sourceData) {
        if (grid.appScope.viewCommitPopover.getActive() === 'Commit') {
          return row.entity.sourceData.commit.ippfData.quarter.previousWeek.revenue.value;
        }
        return row.entity.sourceData.bestCanDo.ippfData.quarter.previousWeek.revenue.value;
      }
      return input;
    } else if (col.name === 'scdsCommitRev') {
      if (row.entity.sourceData) {
        if (grid.appScope.viewCommitPopover.getActive() === 'Commit') {
          return row.entity.sourceData.commit.scData.quarter.previousWeek.revenue.value;
        }
        return row.entity.sourceData.bestCanDo.scData.quarter.previousWeek.revenue.value;
      }
      return input;
    } else if (col.name === 'Opp Descr') {
      return row.entity.account.Attributes['Opp Descr'];
    } else if (col.name === 'load.Dec Date_load') {
      return utilsService.formatField(row.entity.load['Dec Date_load'], 'date', displayDateFormat);
    } else if (col.name === 'load.Contract End Date_load') {
      return utilsService.formatField(row.entity.load['Contract End Date_load'], 'date', displayDateFormat);
    } else if (col.name === 'action.Action Due Date') {
      return utilsService.formatField(row.entity.load['Contract End Date_load'], 'date', displayDateFormat);
    }
    return input;
  };

  this.setFilterOptions = (allOptionArray, optionMap, property) => {
    if (angular.isUndefined(optionMap[property])) {
      allOptionArray.push({
        name: property,
        value: property,
        ticked: false,
      });
      optionMap[property] = 1;
    }
  };

  this.getAllRevenueTargetColDefs = () => [
    angular.copy(this.type),
    this.solidTargetIOTMonth1,
    this.solidTargetIOTMonth2,
    this.solidTargetIOTMonth3,
    this.solidTargetIOTQuarter,
    this.solidTargetIMTMonth1,
    this.solidTargetIMTMonth2,
    this.solidTargetIMTMonth3,
    this.solidTargetIMTQuarter,
  ];

  this.getAllRevenueColsDefs = () => [
    this.type,

    this.solid1Month1,
    this.solid1Month2,
    this.solid1Month1plus2, this.solid1Month3,
    this.solid1Quarter,

    this.solid1PreviousMonth1_ww, this.solid1PreviousMonth2_ww,
    this.solid1PreviousMonth1plus2_ww, this.solid1PreviousMonth3_ww,
    this.solid1PreviousQuarter_ww,
    // Solid cols
    this.solidMonth1, this.solidMonth2,
    this.solidMonth1plus2, this.solidMonth3,
    this.solidQuarter,
    // solid cols W/W
    this.solidPreviousMonth1_ww, this.solidPreviousMonth2_ww,
    this.solidPreviousMonth1plus2_ww, this.solidPreviousMonth3_ww,
    this.solidPreviousQuarter_ww,

    // Risk cols
    this.riskMonth1, this.riskMonth2, this.riskMonth1plus2,
    this.riskMonth3, this.riskQuarter,
    // Risk cols W/W
    this.riskPreviousMonth1_ww, this.riskPreviousMonth2_ww,
    this.riskPreviousMonth1plus2_ww, this.riskPreviousMonth3_ww,
    this.riskPreviousQuarter_ww,
    // Commit cols
    this.month1, this.month2,
    this.month1plus2, this.month3, this.quarter,
    // Commit W/W
    this.previousMonth1, this.previousMonth2,
    this.previousMonth1plus2, this.previousMonth3,
    this.previousQuarter,
    // Stretch cols
    this.stretchMonth1, this.stretchMonth2,
    this.stretchMonth1plus2, this.stretchMonth3,
    this.stretchQuarter,
    // Stretch cols W/W
    this.stretchPreviousMonth1_ww, this.stretchPreviousMonth2_ww,
    this.stretchPreviousMonth1plus2_ww, this.stretchPreviousMonth3_ww,
    this.stretchPreviousQuarter_ww,
    // Best Can Do cols
    this.bestCanDoMonth1, this.bestCanDoMonth2,
    this.bestCanDoMonth1plus2, this.bestCanDoMonth3,
    this.bestCanDoQuarter,
    // Best Can Do cols W/W
    this.bestCanDopreviousMonth1_ww, this.bestCanDopreviousMonth2_ww,
    this.bestCanDopreviousMonth1plus2_ww,
    this.bestCanDopreviousMonth3_ww, this.bestCanDopreviousQuarter_ww,
  ];

  this.getRowFilters = (state, rootNode) => {
    let stateName = state;
    if (state.current && state.current.name) stateName = state.current.name;
    const defaultRes = [{
      name: 'Rev',
      visible: true,
    },
    {
      name: 'Cost',
      visible: false,
    },
    {
      name: 'cGP$',
      visible: false,
    },
    {
      name: 'cGP%',
      visible: false,
    },
    ];

    const result = UserSettingsService.getRoadmapRowsState(stateName, rootNode);
    if (result === undefined) {
      return defaultRes;
    }
    for (let i = 0; i < defaultRes.length; i += 1) {
      defaultRes[i].visible = result[i].visible;
    }

    return defaultRes;
  };

  this.getTargetRowFilters = (state, rootNode) => {
    const defaultRows = [{
      name: 'Rev',
      visible: true,
    },
    {
      name: 'cGP$',
      visible: false,
    },
    ];

    const resultTarget = UserSettingsService.getRoadmapRowsState(state.current.name, rootNode);
    if (resultTarget === undefined) {
      return defaultRows;
    }
    for (let i = 0; i < 2; i += 1) {
      defaultRows[i].visible = resultTarget[i].visible;
    }

    return defaultRows;
  };

  this.enableRows = (columnFilters, rowFiltersCopy) => {
    for (let i = 0; i < columnFilters.length; i += 1) {
      if (columnFilters[i].visible === true && columnFilters[i].canDisableRows === true) {
        return true;
      }
    }
    rowFiltersCopy[0].visible = true;
    for (let i = 1; i < rowFiltersCopy.length; i += 1) {
      rowFiltersCopy[i].visible = false;
    }
    return false;
  };

  this.countVisible = (arr) => {
    let count = 0;
    for (let i = 0; i < arr.length; i += 1) {
      if (arr[i].visible === true) count += 1;
    }
    return count;
  };

  this.getRowHeight = ($scope) => {
    let activeRows = 0;
    for (let i = 0; i < $scope.rowFilters.length; i += 1) {
      if ($scope.rowFilters[i].visible === true) {
        activeRows += 1;
      }
    }
    return activeRows <= 1 ? 40 : (activeRows * 35);
  };

  this.getRowHeightByFilters = (rowFilters) => {
    let activeRows = 0;
    for (let i = 0; i < rowFilters.length; i += 1) {
      if (rowFilters[i].visible === true) {
        activeRows += 1;
      }
    }
    return activeRows <= 1 ? 40 : (activeRows * 35);
  };

  this.entryHeightByRowsPerEntry = (pVisibleRows) => {
    let entryHeight;
    switch (pVisibleRows) {
      case 0:
      case 1:
        entryHeight = 40;
        break;
      case 2:
        entryHeight = 70;
        break;
      case 3:
        entryHeight = 105;
        break;
      default:
        entryHeight = 140;
    }
    return entryHeight;
  };

  this.handleRowFiltering = ($scope, $state, rootNode) => {
    angular.copy($scope.rowFiltersCopy, $scope.rowFilters);
    $scope.gridOptions.rowHeight = this.getRowHeight($scope);
    $scope.gridOptions.columnFooterHeight = this.getRowHeight($scope);
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
    UserSettingsService.saveRoadmapRowsState($state.current.name, rootNode, $scope.rowFiltersCopy);
  };

  this.handleColumnFiltering = ($scope, roadmapType, rootNode) => {
    for (let i = 0; i < $scope.columnFilters.length; i += 1) {
      $scope.gridOptions.columnDefs[i].visible = $scope.columnFilters[i].visible;
    }
    UserSettingsService.saveRoadmapColumnsState(roadmapType, rootNode, $scope.columnFilters);
  };

  let scopeId;
  this.updateUIGridHeight = ($scope) => {
    if (scopeId !== $scope.$id) {
      const updateEvent = debounce(() => {
        if (scopeId === $scope.$id) this.updateUIGridHeight($scope);
      }, 250);
      $rootScope.$on('showHideMeasurements', () => {
        $timeout(() => { if (scopeId === $scope.$id) this.updateUIGridHeight($scope); });
      });
      $window.addEventListener('resize', updateEvent);
      scopeId = $scope.$id;
    }

    const MINIMUM_HEIGHT = 400;
    const paddingTop = ibpCache.userSettingsPermanentCache.get('showHideMeasurements') ? 80 : 220;
    function getInfiniteScrollSize(currentHeight) {
      const heigth = (currentHeight + paddingTop)
      - (document.documentElement.offsetHeight - document.documentElement.clientHeight);
      if (heigth < MINIMUM_HEIGHT) return MINIMUM_HEIGHT;
      return heigth;
    }

    let currentHeight;
    if (angular.isDefined($scope.gridApi) || angular.isDefined($scope.gridApiTop)) {
      if ($scope.uiGridStyle === undefined) {
        currentHeight = 540; // Set to defaul UI grid size in CSS
      } else {
        currentHeight =
          parseInt($scope.uiGridStyle.height.substring(0, $scope.uiGridStyle.height.length - 1),
            10);
      }
      const height = getInfiniteScrollSize(currentHeight);
      $scope.uiGridStyle = { height: `${height}px` };
    }
    fullScreenSpinner.hide();
  };

  function calculateGridHeight(numEntriesDisplayed, rowFiltersCopy) {
    let visibleRows = 0; // number of rows per entry enabled in filter
    for (let i = 0; i < rowFiltersCopy.length; i += 1) {
      if (rowFiltersCopy[i].visible) {
        visibleRows += 1;
      }
    }
    let gridContainerHeight;
    const minHeight = 140; // discovered by testing
    if (numEntriesDisplayed === 0) {
      const bodyHeightNoEntries = 50;
      gridContainerHeight = minHeight + bodyHeightNoEntries;
    } else {
      gridContainerHeight = minHeight + (numEntriesDisplayed
        * this.entryHeightByRowsPerEntry(visibleRows));
    }
    return gridContainerHeight;
  }
  

  this.getAdditionalFields = () => {
    
    let additionalFields = {
      queryExtra: [],
      ui: [],
    };
    if (typeof CognosService.CognosConfigService.prop.ADDITIONAL_FIELDS !== 'undefined') {
     
      try {
        additionalFields = JSON.parse(CognosService.CognosConfigService.prop.ADDITIONAL_FIELDS);
      } catch (error) {
        throw new Error(`JSON.parse error at acc component: ${error.message}`);
      }
    }
    return additionalFields;
  };
}

module.exports = AccountsUIService;
