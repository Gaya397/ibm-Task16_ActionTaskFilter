import angular from 'angular';

roadmapCommonService.$inject = ['AccountsUIService', 'CognosConfigService', 'UserSettingsService',
  'utilsService', 'StaticMappingService', 'CognosService',
];

export default function roadmapCommonService(AccountsUIService, CognosConfigService, UserSettingsService,
  utilsService, StaticMappingService, CognosService) {
  const ROADMAPS = {
    action: 'roadmap.actions',
    contract: 'roadmap.contracts',
    account: 'roadmap.accounts',
  };

  let rootNode = null;
  if (typeof StaticMappingService.getRegionReadableProp() !== 'undefined') {
    rootNode = StaticMappingService.getRegionReadableProp().name;
  }

  const additionalFields = AccountsUIService.getAdditionalFields();
  // Grid options IBP styled roadmaps should use
  function DefaultGridOptions() {
    this.headerTemplate = 'components/accounts/header-template.html';
    this.footerTemplate = 'components/accounts/footer-template.html';
    this.enableFiltering = true;
    this.enableColumnResizing = true;
    this.enableGridMenu = false;
    this.enableColumnMenus = false;
    this.showColumnFooter = true;
    this.multiSelect = false;
    this.enableRowHeaderSelection = false;
  }

  function getRoadmapColumnDefs(roadmap, stateName, ignoreRevenueFields) {
    switch (roadmap) {
      case ROADMAPS.action:
      case ROADMAPS.contract:
        return getContractActionsColumnDefs(roadmap, stateName, ignoreRevenueFields);
      case ROADMAPS.account:
        return getRoadmapAccountLevelColumnDefs();
      default:
        return getContractActionsColumnDefs('roadmap.contracts', stateName);
    }
  }

  function getContractActionsColumnDefs(roadmap, stateName, ignoreRevenueFields) {
    const result = [
      // Key Info
      AccountsUIService.showEditIcon, AccountsUIService.accountName, AccountsUIService.customerName,
      AccountsUIService.contractNumber, AccountsUIService.legalNumber,
      AccountsUIService.roadmapItemType, AccountsUIService.oppDescr, AccountsUIService.serviceLine,
      AccountsUIService.affiliates,

      // Prev QTR Performance
      AccountsUIService.previousQuarterPerformanceQuarter,

      // Load Info
      AccountsUIService.source, AccountsUIService.sourceRev,
      AccountsUIService.dsCommitRev, AccountsUIService.dsCommitRevPrev,
      AccountsUIService.scdsCommitRev, AccountsUIService.scdsCommitRevPrev,

      // PCW
      AccountsUIService.pcwRev, AccountsUIService.pcwPerformed, AccountsUIService.signYieldPCW,

      // Supporting information
      AccountsUIService.parentBusinessUnit,
      AccountsUIService.projectRRApproval, AccountsUIService.projectCountry,
      AccountsUIService.projectIndustry, AccountsUIService.projectCustomerNbr,
      AccountsUIService.projectExecutionOwner, AccountsUIService.projectProjectManager,
      AccountsUIService.projectContractStartDate, AccountsUIService.projectContractEndDate,
      AccountsUIService.projectOppyOwner, AccountsUIService.projectSaleStatus,
      AccountsUIService.projectSaleStage, AccountsUIService.projectDecDate,
      AccountsUIService.tcvLoad, AccountsUIService.oppy,
    ];

    if (UserSettingsService.getRegion() === 'EU-GTS') {
      result.push(AccountsUIService.Priority);
      result.push(AccountsUIService.Probability);
      result.push(AccountsUIService.ragIppf);
      result.push(AccountsUIService.RoadmapClass);
    }


    if (angular.isUndefined(ignoreRevenueFields) || ignoreRevenueFields === false) {
      let i = 8;
      AccountsUIService.getAllRevenueColsDefs().forEach((el) => {
        if ((roadmap === 'roadmap.actions' && el.category !== 'Forecast') || (roadmap === 'roadmap.contracts')) {
          result.splice(i += 1, 0, el);
        }
      });
    }

    if (roadmap === 'roadmap.actions') {
      result.splice(9, 0, AccountsUIService.RevenueRiskCategory, AccountsUIService.Comment,
        AccountsUIService.Owner, AccountsUIService.DueDate, AccountsUIService.RAG,AccountsUIService.ActionTaskid);
      if (CognosConfigService.prop.RICH_COMMENT) result.splice(11, 0, AccountsUIService.RichComment);
      const fieldsToBeAdded = [];
      if (angular.isDefined(additionalFields.ui) && Array.isArray(additionalFields.ui)) {
        additionalFields.ui.forEach((uiElement) => {
          if (angular.isUndefined(uiElement.excludefromaction) || uiElement.excludefromaction !== 'true') {
            fieldsToBeAdded.push(uiElement);
          }
        });
      }
      utilsService.addAdditionalUIGridFields(result, fieldsToBeAdded, 'account', AccountsUIService, 'action');
      for (let ii = 0; ii < result.length; ii += 1) {
        if (result[ii].name === 'set_1.Action Comment') {
          result.splice(ii, 1);
          break;
        }
      }
    
      if (UserSettingsService.getRegion() === 'EU-GTS') {
        result.splice(15, 0, AccountsUIService.Review);
        result.splice(16, 0, AccountsUIService.valueCategory);
      }
    } else {
      utilsService.addAdditionalUIGridFields(result, additionalFields.ui, 'account', AccountsUIService, '');
    }
    if (UserSettingsService.getRegion() === 'EU-GTS') result.splice(2, 0, AccountsUIService.longName);
    return UserSettingsService.getRoadmapColumnsState(result, stateName || roadmap, rootNode);
  }

  function getRoadmapAccountLevelColumnDefs() {
    const result = [
      AccountsUIService.showEditIcon,
      AccountsUIService.accountName,
      AccountsUIService.cadenceComment,
      // Prev QTR Performance
      AccountsUIService.previousQuarterPerformanceQuarter,
      AccountsUIService.previousQuarterToQuarterCommit,
      AccountsUIService.previousQuarterToQuarterBestCanDo,
      AccountsUIService.previousYearToYearCommit,
      AccountsUIService.previousYearToYearBestCanDo,
    ];
    if (CognosService.CognosConfigService.prop.ENABLE_FINANCIAL_GOALS === true) {
      result.push(AccountsUIService.financialGoalBestCanDo); 
      result.push(AccountsUIService.financialGoalDelta);
    }
    let i = 2;
    AccountsUIService.getAllRevenueColsDefs().forEach((el) => {
      if (el.category !== 'Forecast') {
        result.splice(i += 1, 0, el);
      }
    });
    if (UserSettingsService.getRegion() === 'EU-GTS') result.splice(2, 0, AccountsUIService.longName);
    return UserSettingsService.getRoadmapColumnsState(result, ROADMAPS.account, rootNode);
  }

  function isMatchNodeOwner(row, matcher) {
    if (UserSettingsService.getRegion() === 'EU-GTS') {
      if (row && row.entity && row.entity.approval && row.entity.approval.Attributes) {
        const nodeOwner = row.entity.approval.Attributes['Owner Name']; 
        return angular.isDefined(nodeOwner) && nodeOwner !== '' && nodeOwner.match(matcher); 
      } 
    } 
    return false; 
  }

  function isInCadenceComment(row, matcher) {
    if (UserSettingsService.getRegion() === 'EU-GTS') {
      if (row && row.entity && row.entity.account && row.entity.account.cadenceComment) {
        return row.entity.account.cadenceComment.match(matcher); 
      } 
    } 
    return false; 
  }

  function getSearchRenderableRows(renderableRows, columnDefs, searchTerm) {
    if (typeof searchTerm !== 'undefined') {
      let expression = searchTerm.replace(/[\\\^\$\*\+\?\!\[\]\{\}\,]*/g, '');
      expression = expression.replace(/[)]/g, '.');
      expression = expression.replace(/[(]/g, '.');
      const matcher = new RegExp(expression, ['i']); // matches chars with diacritics as well - in Swedish etc.
      renderableRows.forEach((row) => {
        let match = isMatchNodeOwner(row, matcher) || isInCadenceComment(row, matcher);

        columnDefs.forEach((field) => {
          if (!match) {
            const matchFound = utilsService.isFieldMatchingTheMatcher(field, matcher, row);
            if (matchFound) {
              match = matchFound;
            }
          }
        });
        if (!match) {
          row.visible = false;
        }
      });
    }
    return renderableRows;
  }

  return {
    getDefaultGridOptions: () => new DefaultGridOptions(),
    getRoadmapColumnDefs,
    getSearchRenderableRows,
    ROADMAPS,
  };
}