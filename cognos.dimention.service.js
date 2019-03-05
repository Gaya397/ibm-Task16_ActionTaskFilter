module.exports = CognosDimentionService;

CognosDimentionService.$inject = ['$http', '$log', 'CognosCamService', 'CognosConfigService', 'ErrorService'];
function CognosDimentionService($http, $log, CognosCamService, CognosConfigService, ErrorService) {
  $log.info('------------------------------------------------> CognosDimentionService');
  const service = {};

  service.cubes = {
    RR_INPUT: CognosConfigService.prop.MAIN_CUBE,
    EXTRA_DIMENSION_RR_INPUT: CognosConfigService.prop.EXTRA_DIMENSION_MAIN_CUBE,
  };

  service.dimentions = {
    RR_INPUT: {
      approvals: CognosConfigService.prop.RR_APPROVAL_DIMENTION,
      accounts: CognosConfigService.prop.ACCOUNTS_PROJECTS,
      measures: CognosConfigService.prop.RR_MEASURES_DIMENTION,
      approval: CognosConfigService.prop.RR_APPROVAL_DIMENTION,
      versions: 'version',
      versionRr: 'version rr',
      timeYears: 'time - years',
      timeQuarters: 'time - quarters',
      timeWeeks: 'time - weeks',
      serviceLines: 'Service Lines',
      riskCategories: 'Revenue Risk Category',
      salesStageLoad: 'Sales Stage_load',
      extraDimentionMeasures: CognosConfigService.prop.EXTRA_DIMENSION_RR_MEASURES_DIMENTION,
      roadmapItemType: 'Roadmap Item Type', 
    },
    DATA_MAPPING: {
      'Service Lines': 'serviceLine',
      'Revenue Risk Category': 'revenueRiskCategory',
      'Roadmap Item Type': 'roadmapItemType',
      'Settings_Variables': 'settingVariables',
    },
    RR_MGMT: {
      versions: 'version rr',
      timeYears: 'time - years',
      timeQuarters: 'time - quarters',
      timeWeeks: 'time - weeks',
      serviceLines: 'Service Lines',
      riskCategories: 'Revenue Risk Category',
      approvals: CognosConfigService.prop.RR_APPROVAL_MGMT,
      accounts: CognosConfigService.prop.ACCOUNTS_PROJECTS,
      measures: CognosConfigService.prop.RR_MEASURES_DIMENTION,
      roadmapItemType: CognosConfigService.prop.RR_MGMT_ROADMAP_DIMENSION,
    },
    RR_REPORTING: {
      countries: 'organization v3',
      sectors: 'SC IndustrySector',
    },
    PCW_REPORTING: {
      timeYears: 'time - years',
      timeQuarters: 'time - quarters',
      timeWeeks: 'time - weeks',
      timeIntervals: 'pcw time - intervals',
      businessUnits: 'pcw approval report',
      sectors: 'SC IndustrySector',
      serviceLines: 'lob',
      accounts: CognosConfigService.REPORTING_ACCOUNTS_PROJECTS,
      measures: CognosConfigService.REPORTING_MEASURES_DIMENTION,
      measureWeeks: 'pcw measures weeks',
      executionOwners: 'execution owner',
      opportunityOwners: 'opportunity owner',
      claimCodes: 'claim code flag',
      salesStatuses: 'pcw sales status',
      types: 'pcw type',
      labourCategories: 'labour category v3',
    }    
  };

  service.columns = {
    RR_INPUT: {
      _0: '_0', // Used to determine Zero RDM
      _1: '_1', // User to determine Account RDM
      underscore_one: '_1', // User to determine Account RDM
      underscore_zero: '_0',
      underscore: '_', // User to determine Account RDM
      actionFlag: 'Action flag', // User to determine Action RDM  !CASE SENSITIVE!
      actionType: 'Action Type',
      actionComment: 'Action Comment',
      actionRichComment: 'Comment',
      actionOwner: 'Action Owner',
      actionTaskid: 'Action Task_id',
      actionDueDate: 'Action Due Date',
      coverage_id_load: 'Coverage id_load',
      customer_Name_load: 'Customer Name_load',
      cost_M1: 'M1 Cost',
      cost_M2: 'M2 Cost',
      cost_M1_M2: 'M1 M2 Cost',
      cost_M3: 'M3 Cost',
      cost_Qtr: 'QTR Cost',
      cost_non_travel_M1: 'M1 Non-Travel Cost',
      cost_non_travel_M2: 'M2 Non-Travel Cost',
      cost_non_travel_M1_M2: 'M1 M2 Non-Travel Cost',
      cost_non_travel_M3: 'M3 Non-Travel Cost',
      cost_non_travel_Qtr: 'Qtr Non-Travel Cost',

      cGPAmount_M1: 'M1 cGP$',
      cGPAmount_M2: 'M2 cGP$',
      cGPAmount_M1_M2: 'M1 M2 cGP$',
      cGPAmount_M3: 'M3 cGP$',
      cGPAmount_Qtr: 'QTR cGP $',

      cGP_non_travelAmount_M1: 'M1 Non-Travel cGP$',
      cGP_non_travelAmount_M2: 'M2 Non-Travel cGP$',
      cGP_non_travelAmount_M1_M2: 'M1 M2 Non-Travel cGP$',
      cGP_non_travelAmount_M3: 'M3 Non-Travel cGP$',
      cGP_non_travelAmount_Qtr: 'Qtr Non-Travel cGP$',

      cGP_non_travelProcents_M1: 'M1 Non-Travel cGP%',
      cGP_non_travelProcents_M2: 'M2 Non-Travel cGP%',
      cGP_non_travelProcents_M1_M2: 'M1 M2 Non-Travel cGP%',
      cGP_non_travelProcents_M3: 'M3 Non-Travel cGP%',
      cGP_non_travelProcents_Qtr: 'Qtr Non-Travel cGP%',

      cGPProcents_M1: 'M1 cGP%',
      cGPProcents_M2: 'M2 cGP%',
      cGPProcents_M1_M2: 'M1 M2 cGP%',
      cGPProcents_M3: 'M3 cGP%',
      cGPProcents_Qtr: 'QTR cGP %',

      cGPPlan: 'QTR cGP% Plan',
      costRollOver: 'Cost Roll-over',
      cGPProcentsRollOver: 'cGP% Roll-over',
      cGPAmountRollOver: 'cGP$ Roll-over',
      costRollOverY: 'Cost SameQPrevY',
      cGPProcentsRollOverY: 'cGP% SameQPrevY',
      cGPAmountRollOverY: 'cGP$ SameQPrevY',
      revenueRollOverY: 'Rev SameQPrevY', 
      decDate_load: 'Dec Date_load',
      decDate: 'Dec Date',
      industry_load: 'Industry_load',
      industry: 'Industry',
      opp_Descr_load: 'Opp Descr_load',
      opp_Descr: 'Opp Descr',
      opp_load: 'Oppy #_load',
      opp: 'Oppy #',
      opp_Owner_load: 'Oppy Owner_load',
      opp_Owner: 'Oppy Owner',
      pcwIdentified: 'PCW Identified',
      pcwPerformed: 'PCW Performed',
      project_Manager_load: 'Project Manager_load',
      project_Manager: 'Project Manager',
      business_unit: 'Business Unit',
      rowName: 'rowName',
      revenue_M1: 'M1 Rev',
      revenue_M2: 'M2 Rev',
      revenue_M1_M2: 'M1 M2 Rev',
      revenue_M3: 'M3 Rev',
      revenue_Qtr: 'QTR Rev',
      revenue_non_travel_M1: 'M1 Non-Travel Rev',
      revenue_non_travel_M2: 'M2 Non-Travel Rev',
      revenue_non_travel_M1_M2: 'M1 M2 Non-Travel Rev',
      revenue_non_travel_M3: 'M3 Non-Travel Rev',
      revenue_non_travel_Qtr: 'Qtr Non-Travel Rev',
      revenueRollOver: 'Rev Roll-over',
      revenueTBSigned_Qtr: 'QTR Rev TB Signed',
      revenueBacklog_Qtr: 'QTR Rev Backlog',
      revenueSigned_Qtr: 'QTR Rev Signed',
      roadmapItemType: 'Roadmap Item Type',
      roadmap_Item_Type_load: 'Roadmap Item Type_load',
      rr_Approval: 'R R Approval',
      sales_Stage_load: 'Sales Stage_load',
      sales_Stage: 'Sales Stage',
      serviceLine: 'Service Line',
      serviceList: 'Services list',
      source: 'Source',
      zeroCheck: 'ZeroCheck',
      projectManager_load: 'Project Manager_load',
      tcv_load: 'TCV_load',
      contractStartDate_load: 'Contract Start Date_load',
      contractStartDate: 'Contract Start Date',
      contractEndDate_load: 'Contract End Date_load',
      contractEndDate: 'Contract End Date',
      salesStatus_load: 'Sales Status_load',
      salesStatus: 'Sales Status',
      executionOwner_load: 'Execution Owner_load',
      executionOwner: 'Execution Owner',
      oppyOwner: 'Oppy Owner_load',
      accountName_load: 'Account Name_load',
      legalContractNumber_load: 'Legal Contract Number_load',
      legalContractNumber: 'Legal Contract Number',
      contractNumber: 'Contract Number',
      oppDescription_load: 'Opp Descr_load',
      contractOpp: 'Contract/Opp #',
      country_load: 'Country_load',
      country: 'Country',
      rag: 'RAG',
      rag_load: 'RAG_load',
      revenueBacklog_M1: 'M1 Rev Backlog',
      revenueBacklog_M1_M2: 'M1 M2 Rev Backlog',
      revenueBacklog_M2: 'M2 Rev Backlog',
      revenueBacklog_M3: 'M3 Rev Backlog',
      revenueSigned_M1: 'M1 Rev Signed',
      revenueSigned_M1_M2: 'M1 M2 Rev Signed',
      revenueSigned_M2: 'M2 Rev Signed',
      revenueSigned_M3: 'M3 Rev Signed',
      revenueTBSigned_M1: 'M1 Rev TB Signed',
      revenueTBSigned_M1_M2: 'M1 M2 Rev TB Signed',
      revenueTBSigned_M2: 'M2 Rev TB Signed',
      revenueTBSigned_M3: 'M3 Rev TB Signed',

      costBacklog_M1: 'M1 Cost Backlog',
      costBacklog_M2: 'M2 Cost Backlog',
      costBacklog_M3: 'M3 Cost Backlog',

      revenueBase_M1: 'M1 Rev Base',
      revenueBase_M2: 'M2 Rev Base',
      revenueBase_M3: 'M3 Rev Base',
      revenueBase_QTR: 'QTR Rev Base',
      costBase_M1: 'M1 Cost Base',
      costBase_M2: 'M2 Cost Base',
      costBase_M3: 'M3 Cost Base',
      costBase_QTR: 'QTR Cost Base',
      cgpAmountBase_M1: 'M1 cGP$ Base',
      cgpAmountBase_M2: 'M2 cGP$ Base',
      cgpAmountBase_M3: 'M3 cGP$ Base',
      cgpAmountBase_QTR: 'QTR cGP$ Base',
      cgpPercentsBase_M1: 'M1 cGP% Base',
      cgpPercentsBase_M2: 'M2 cGP% Base',
      cgpPercentsBase_M3: 'M3 cGP% Base',
      cgpPercentsBase_QTR: 'QTR cGP% Base',

      revenueSignings_M1: 'M1 Rev Signings',
      revenueSignings_M2: 'M2 Rev Signings',
      revenueSignings_M3: 'M3 Rev Signings',
      revenueSignings_QTR: 'QTR Rev Signings',
      costSignings_M1: 'M1 Cost Signings',
      costSignings_M2: 'M2 Cost Signings',
      costSignings_M3: 'M3 Cost Signings',
      costSignings_QTR: 'QTR Cost Signings',
      cgpAmountSignings_M1: 'M1 cGP$ Signings',
      cgpAmountSignings_M2: 'M2 cGP$ Signings',
      cgpAmountSignings_M3: 'M3 cGP$ Signings',
      cgpAmountSignings_QTR: 'QTR cGP$ Signings',
      cgpPercentsSignings_M1: 'M1 cGP% Signings',
      cgpPercentsSignings_M2: 'M2 cGP% Signings',
      cgpPercentsSignings_M3: 'M3 cGP% Signings',
      cgpPercentsSignings_QTR: 'QTR cGP% Signings',

      costSigned_M1: 'M1 Cost Signed',
      costSigned_M2: 'M2 Cost Signed',
      costSigned_M3: 'M3 Cost Signed',

      costTBSigned_M1: 'M1 Cost TB Signed',
      costTBSigned_M1_M2: 'M1 M2 Cost TB Signed',
      costTBSigned_M2: 'M2 Cost TB Signed',
      costTBSigned_M3: 'M3 Cost TB Signed',

      costBacklog_Qtr: 'QTR Cost Backlog',
      cGPProcentsBacklog_Qtr: 'QTR cGP% Backlog',
      cGPAmountBacklog_Qtr: 'QTR cGP$ Backlog',

      cGPProcentsBacklog_M1: 'M1 cGP% Backlog',
      cGPProcentsBacklog_M1_M2: 'M1 M2 cGP% Backlog',
      cGPProcentsBacklog_M2: 'M2 cGP% Backlog',
      cGPProcentsBacklog_M3: 'M3 cGP% Backlog',

      cGPAmountSigned_M1: 'M1 cGP$ Signed',
      cGPAmountSigned_M1_M2: 'M1 M2 cGP$ Signed',
      cGPAmountSigned_M2: 'M2 cGP$ Signed',
      cGPAmountSigned_M3: 'M3 cGP$ Signed',

      cGPAmountTBSigned_M1: 'M1 cGP$ TB Signed',
      cGPAmountTBSigned_M1_M2: 'M1 M2 cGP$ TB Signed',
      cGPAmountTBSigned_M2: 'M2 cGP$ TB Signed',
      cGPAmountTBSigned_M3: 'M3 cGP$ TB Signed',

      cGPAmountBacklog_M1: 'M1 cGP$ Backlog',
      cGPAmountBacklog_M1_M2: 'M1 M2 cGP$ Backlog',
      cGPAmountBacklog_M2: 'M2 cGP$ Backlog',
      cGPAmountBacklog_M3: 'M3 cGP$ Backlog',

      costTBSigned_Qtr: 'QTR Cost TB Signed',
      cGPAmountTBSigned_Qtr: 'QTR cGP$ TB Signed',
      cGPProcentsTBSigned_Qtr: 'QTR cGP% TB Signed',
      
      cGPProcentsTBSigned_M1: 'M1 cGP% TB Signed',
      cGPProcentsTBSigned_M1_M2: 'M1 M2 cGP% TB Signed',
      cGPProcentsTBSigned_M2: 'M2 cGP% TB Signed',
      cGPProcentsTBSigned_M3: 'M3 cGP% TB Signed',
      
      costSigned_Qtr: 'QTR Cost Signed',
      cGPAmountSigned_Qtr: 'QTR cGP$ Signed',
      cGPProcentsSigned_Qtr: 'QTR cGP% Signed',
      
      cGPProcentsSigned_M1: 'M1 cGP% Signed',
      cGPProcentsSigned_M1_M2: 'M1 M2 cGP% Signed',
      cGPProcentsSigned_M2: 'M2 cGP% Signed',
      cGPProcentsSigned_M3: 'M3 cGP% Signed',

      costMjdg_Qtr: 'QTR Cost Mjdg',
      revenueMjdg_Qtr: 'QTR Rev Mjdg',

      customerNbr: 'Customer_nbr',
      contractFlag: 'Contract flag',
      ordinal: '_Ordinal',
      updatable: '_Updatable',
      sandbox: '_Sandbox',
      priority: 'Priority', 
      probability: 'Probability', 
      roadmapClass: 'Roadmap Class',
      review: 'Review',
      },
    RR_MGMT: {
      _0: '_0',
      actionType: 'Action Type',
      actionComment: 'Action Comment',
      actionRichComment: 'Comment',
      actionOwner: 'Action Owner',
      actionTaskid: 'Action Task_id',
      actionDueDate: 'Action Due Date',
      cost_M1: 'M1 Cost',
      cost_M2: 'M2 Cost',
      cost_M3: 'M3 Cost',
      cost_Qtr: 'QTR Cost',
      cGPAmount_M1: 'M1 cGP$',
      cGPAmount_M2: 'M2 cGP$',
      cGPAmount_M3: 'M3 cGP$',
      cGPAmount_Qtr: 'QTR cGP $',
      cGPProcents_M1: 'M1 cGP%',
      cGPProcents_M2: 'M2 cGP%',
      cGPProcents_M3: 'M3 cGP%',
      cGPProcents_Qtr: 'QTR cGP %',
      rowName: 'rowName',
      revenue_M1: 'M1 Rev',
      revenue_M2: 'M2 Rev',
      revenue_M3: 'M3 Rev',
      revenue_Qtr: 'QTR Rev',
      revenueTBSigned_Qtr: 'QTR Rev TB Signed',
      revenueBacklog_Qtr: 'QTR Rev Backlog',
      revenueSigned_Qtr: 'QTR Rev Signed',
      roadmap_Item_Type_load: 'Roadmap Item Type_load',
      roadmapItemType: 'Roadmap Item Type',
      zeroCheck: 'ZeroCheck',
      revenueBacklog_M1: 'M1 Rev Backlog',
      revenueBacklog_M1_M2: 'M1 M2 Rev Backlog',
      revenueBacklog_M2: 'M2 Rev Backlog',
      revenueBacklog_M3: 'M3 Rev Backlog',
      revenueSigned_M1: 'M1 Rev Signed',
      revenueSigned_M1_M2: 'M1 M2 Rev Signed',
      revenueSigned_M2: 'M2 Rev Signed',
      revenueSigned_M3: 'M3 Rev Signed',
      revenueTBSigned_M1: 'M1 Rev TB Signed',
      revenueTBSigned_M2: 'M2 Rev TB Signed',
      revenueTBSigned_M1_M2: 'M1 M2 Rev TB Signed',
      revenueTBSigned_M3: 'M3 Rev TB Signed',

      costBacklog_M1: 'M1 Cost Backlog',
      costBacklog_M2: 'M2 Cost Backlog',
      costBacklog_M3: 'M3 Cost Backlog',

      costSigned_M1: 'M1 Cost Signed',
      costSigned_M2: 'M2 Cost Signed',
      costSigned_M3: 'M3 Cost Signed',

      costTBSigned_M1: 'M1 Cost TB Signed',
      costTBSigned_M2: 'M2 Cost TB Signed',
      costTBSigned_M3: 'M3 Cost TB Signed',

      costBacklog_Qtr: 'QTR Cost Backlog',
      cGPProcentsBacklog_Qtr: 'QTR cGP% Backlog',
      cGPAmountBacklog_Qtr: 'QTR cGP$ Backlog',

      cGPProcentsBacklog_M1: 'M1 cGP% Backlog',
      cGPProcentsBacklog_M2: 'M2 cGP% Backlog',
      cGPProcentsBacklog_M3: 'M3 cGP% Backlog',

      cGPAmountSigned_M1: 'M1 cGP$ Signed',
      cGPAmountSigned_M2: 'M2 cGP$ Signed',
      cGPAmountSigned_M3: 'M3 cGP$ Signed',

      cGPAmountTBSigned_M1: 'M1 cGP$ TB Signed',
      cGPAmountTBSigned_M2: 'M2 cGP$ TB Signed',
      cGPAmountTBSigned_M3: 'M3 cGP$ TB Signed',

      cGPAmountBacklog_M1: 'M1 cGP$ Backlog',
      cGPAmountBacklog_M2: 'M2 cGP$ Backlog',
      cGPAmountBacklog_M3: 'M3 cGP$ Backlog',

      costTBSigned_Qtr: 'QTR Cost TB Signed',
      cGPAmountTBSigned_Qtr: 'QTR cGP$ TB Signed',
      cGPProcentsTBSigned_Qtr: 'QTR cGP% TB Signed',

      costSigned_Qtr: 'QTR Cost Signed',
      cGPAmountSigned_Qtr: 'QTR cGP$ Signed',
      cGPProcentsSigned_Qtr: 'QTR cGP% Signed',
      ordinal: '_Ordinal',
      updatable: '_Updatable',
      sandbox: '_Sandbox',
    },
  };

  service.columns.RR_ROADMAP_TYPE_DIMENSION = angular.copy(service.columns.RR_INPUT);
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueTBSigned_Qtr = 'QTR Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueBacklog_Qtr = 'QTR Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueSigned_Qtr = '';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueBacklog_M1 = 'M1 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueBacklog_M1_M2 = 'M1 M2 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueBacklog_M2 = 'M2 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueBacklog_M3 = 'M3 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueSigned_M1 = '';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueSigned_M1_M2 = '';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueSigned_M2 = '';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueSigned_M3 = '';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueTBSigned_M1 = 'M1 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueTBSigned_M2 = 'M2 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueTBSigned_M1_M2 = 'M1 M2 Rev';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.revenueTBSigned_M3 = 'M3 Rev';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.costBacklog_M1 = 'M1 Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.costBacklog_M2 = 'M2 Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.costBacklog_M3 = 'M3 Cost';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.costSigned_M1 = 'M1 Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.costSigned_M2 = 'M2 Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.costSigned_M3 = 'M3 Cost';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.costTBSigned_M1 = 'M1 Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.costTBSigned_M2 = 'M2 Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.costTBSigned_M3 = 'M3 Cost';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.costBacklog_Qtr = 'QTR Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPProcentsBacklog_Qtr = 'QTR cGP %';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountBacklog_Qtr = 'QTR cGP $';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPProcentsBacklog_M1 = 'M1 cGP%';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPProcentsBacklog_M2 = 'M2 cGP%';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPProcentsBacklog_M3 = 'M3 cGP%';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountSigned_M1 = 'M1 cGP$';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountSigned_M2 = 'M2 cGP$';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountSigned_M3 = 'M3 cGP$';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountTBSigned_M1 = 'M1 cGP$';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountTBSigned_M2 = 'M2 cGP$';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountTBSigned_M3 = 'M3 cGP$';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountBacklog_M1 = 'M1 cGP$';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountBacklog_M2 = 'M2 cGP$';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountBacklog_M3 = 'M3 cGP$';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.costTBSigned_Qtr = 'QTR Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountTBSigned_Qtr = 'QTR cGP $';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPProcentsTBSigned_Qtr = 'QTR cGP %';

  service.columns.RR_ROADMAP_TYPE_DIMENSION.costSigned_Qtr = 'QTR Cost';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPAmountSigned_Qtr = 'QTR cGP $';
  service.columns.RR_ROADMAP_TYPE_DIMENSION.cGPProcentsSigned_Qtr = 'QTR cGP %';

  service.riskCategories = {
    RR_INPUT: {
      commit: 'Commit',
      categories: 'Categories',
      bestCanDo: 'Best Can Do',
      solid: 'Solid',
      solid1: 'Solid-1',
      actual: 'Actual',
      risk: 'Risk',
      risk1: 'Risk-1',
      stretch: 'Stretch',
      stretch1: 'Stretch-1',
      mjdg: 'MJDG',
      mgmtJudgement: 'Mgmt Judgement', 
    },
  };
  service.revenueRiskCategory = {
    RR_INPUT: {
      solid1: 'Solid - 1',
    },
  };

  service.weeks = {
    RR_INPUT: {
      currentWeek: 'Current Week',
      previousWeek: 'Delta to prev Wk',
      closingWeek: 'Closing Wk',

    },
  };
  service.timeYears = {
    RR_INPUT: {
      currentYear: 'Current Year',
    },
  };
  service.timeQuarters = {
    RR_INPUT: {
      currentQuarter: 'Current Quarter',
    },
  };

  service.versions = {
    RR_INPUT: {
      actual: 'Actual',
      target: 'Target IOT',
      targetIOT: 'Target IOT',
      targetIMT: 'Target IMT',
      loadIPPF: 'Load IPPF',
      LoadSC: 'Load SC',
      sourceCheck: 'Source Check',
      certifiedBacklog: 'Certified Backlog',
      financialGoals: 'FIN Goal',
    },
  };

  service.serviceLines = {
    RR_INPUT: {
      totalServiceLines: 'Total Service Lines',
      roadmapServiceLines: 'Rdmp Service Lines',
      accountServiceLines: 'Account Rdmp Service Lines',
      allServiceLines: 'All Service Lines',
      AADJ: 'AADJ',
      activeSL: 'services list',
      servicesList: 'services list',
      dummy: 'Dummy',
      top: 'TOP',
      una: 'UNA',
      pctp: 'PCTP',
      MJDG: 'MJDG', 
    },
  };

  service.accounts = {
    RR_INPUT: {
      total: 'Total Projects',
      dummy: 'Dummy',
      mgmtJudgementSignYield: 'Mgmt Judgement - Sign Yield',
      mgmtJudgementBacklog: 'Mgmt Judgement - Backlog',
    },
  };

  service.roadmapItemTypes = {
    RR_INPUT: {
      totalRoadmapItemType: 'Total Roadmap Item Type',
      backlog: 'Backlog',
      inQuarter: 'In Quarter',
    },
  };

  service.init = () => {
    service.dimentions.RR_INPUT.approvals = CognosConfigService.prop.RR_APPROVAL_DIMENTION;
    service.dimentions.RR_INPUT.approval = CognosConfigService.prop.RR_APPROVAL_DIMENTION;
    service.dimentions.RR_INPUT.accounts = CognosConfigService.prop.ACCOUNTS_PROJECTS;
    service.dimentions.RR_INPUT.measures = CognosConfigService.prop.RR_MEASURES_DIMENTION;
    service.dimentions.RR_INPUT.extraDimentionMeasures = CognosConfigService.prop.EXTRA_DIMENSION_RR_MEASURES_DIMENTION;

    service.cubes.RR_INPUT = CognosConfigService.prop.MAIN_CUBE;
    service.cubes.EXTRA_DIMENSION_RR_INPUT = CognosConfigService.prop.EXTRA_DIMENSION_MAIN_CUBE;

    service.dimentions.DATA_MAPPING[CognosConfigService.prop.ACCOUNTS_PROJECTS] = 'account';
    service.dimentions.DATA_MAPPING[CognosConfigService.prop.RR_APPROVAL_DIMENTION] = 'approval';
  };

  service.getRRDimentionData = (dimention, filter, successCallback, errorCallback) => {
    getDimentionData(dimention, filter, CognosConfigService.baseUrl,
      CognosConfigService.MAIN_CUBE, successCallback, errorCallback);
  };

  service.getRRReportingDimentionData = (dimention, filter, successCallback, errorCallback) => {
    getDimentionData(dimention, filter, CognosConfigService.pcwReportingUrl, 'RR report new', successCallback, errorCallback);
  };

  service.getPCWReportingDimentionData = (dimention, filter, successCallback, errorCallback) => {
    getDimentionData(dimention, filter, CognosConfigService.pcwReportingUrl,
      CognosConfigService.REPORTING_CUBE, successCallback, errorCallback);
  };

  function getDimentionData(dimention, filter, baseUrl, cube, successCallback, errorCallback) {
    if (filter === undefined || filter === null) {
      filter = {};
    }
    if (filter.minLevel === undefined) {
      filter.minLevel = 0;
    }
    if (filter.maxLevel === undefined) {
      filter.maxLevel = 100;
    }
    if (filter.keyValueMapping === undefined) {
      filter.keyValueMapping = {
        key: ['Name'],
        value: ['Attributes', 'Caption'],
      };
    } else {
      if (filter.keyValueMapping.key === undefined) {
        filter.keyValueMapping.key = ['Name'];
      }
      if (filter.keyValueMapping.value === undefined) {
        filter.keyValueMapping.value = ['Attributes', 'Caption'];
      }
    }
    const url = `${baseUrl}/Cubes/${cube}/Dimensions/${dimention}/Hierarchies/${dimention
    }?$expand=Elements($filter=Level ge ${filter.minLevel}and Level le ${filter.maxLevel})`;
    const request = {
      url,
      method: 'GET',
      headers: CognosCamService.getAuthHeader(),
      withCredentials: true,
      cache: false,
    };
    $log.info('REQUEST >>>', request);
    $http(request).then((response) => {
      $log.info('RESPONSE >>>', response);
      if (typeof successCallback !== 'undefined') {
        let result = processTree(response.data, filter.keyValueMapping);
        if (filter.applyLevels === true) {
          result = applyLevels(result);
        }
        successCallback(result);
      }
    }, (response) => {
      if (typeof errorCallback !== 'undefined') {
        errorCallback(ErrorService.createCognosService(response));
      } else {
        $log.info('ERROR', response);
      }
    });
  }

  function processTree(data, keyValueMapping) {
    const result = [];
    let minLevel = 100;
    let maxLevel = 0;
    data.Elements.forEach((e) => {
      if (e.Level < minLevel) {
        minLevel = e.Level;
      }
      if (e.Level > maxLevel) {
        maxLevel = e.Level;
      }
    });
    data.Elements.forEach((e) => {
      let key = e;
      keyValueMapping.key.forEach((k) => {
        key = key[k];
      });
      let value = e;
      keyValueMapping.value.forEach((v) => {
        value = value[v];
      });
      const item = {
        level: convertLevel(e.Level, minLevel, maxLevel),
        key,
        value,
      };
      result.push(item);
    });
    return result;
  }

  function convertLevel(level, minLevel, maxLevel) {
    return maxLevel - level;
  }

  function applyLevels(data) {
    data.forEach((e) => {
      for (let i = 0; i < e.level; i += 1) {
        e.value = `-${e.value}`;
      }
    });
    return data;
  }

  service.prepareColumnsStatment = (measures, dimension) => {
    let columnsStatment = '';
    measures.forEach((e, index) => {
      columnsStatment += `[${dimension}].[${e}]`;
      if (index !== measures.length - 1) {
        columnsStatment += ',';
      }
    });
    return columnsStatment;
  };
  service.prepareColumnsSetStatment = (measures, dimension) => {
    let columnsSetStatment = '';
    measures.forEach((e, index) => {
      columnsSetStatment += `{TM1FILTERBYLEVEL( {TM1DRILLDOWNMEMBER( {[${dimension}].[${e}]}, ALL , RECURSIVE )}, 0)}`;
      if (index !== measures.length - 1) {
        columnsSetStatment += ',';
      }
    });
    if (columnsSetStatment.length > 0) {
      columnsSetStatment = `, ${columnsSetStatment}`;
    }
    return columnsSetStatment;
  };
  service.prepareFilterStatment = (dimensions, values) => {
    if (dimensions.length !== values.length) {
      $log.error('PrepareFilterStatment: dimensions, values are not equal in lenths');
      return null;
    }
    const where = [];
    for (let i = 0; i < dimensions.length; i += 1) {
      where[i] = `[${dimensions[i]}].[${values[i]}]`;
    }
    return where;
  };

  /**
   * Get a data object name form MDX dimension UniqueName
   * @param uniqueName {String} an string name from MDX dimension UniqueName
   * @returns {String} Returns a data object name
   */
  service.getDataObjectNameFromMdxUniqueName = (uniqueName) => {
    const dimentionName = getDimentionName(uniqueName);
    return service.dimentions.DATA_MAPPING[dimentionName];

    function getDimentionName(name) {
      const split = name.split('.');
      return split[0].substr(1, split[0].length - 2);
    }
  };

  return service;
}
