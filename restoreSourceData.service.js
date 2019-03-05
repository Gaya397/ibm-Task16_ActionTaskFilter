module.exports = RestoreSourceDataService;
const angular = require('angular');

RestoreSourceDataService.$inject = ['$log', 'FilterService', 'accountEditCognosService', 'CognosService',
  'CognosDimentionService', 'SandboxService', '$uibModal', '$q', '$timeout', 'NodeStateService'
];

function RestoreSourceDataService($log, FilterService, accountEditCognosService, CognosService,
  CognosDimentionService, SandboxService, $uibModal, $q, $timeout, NodeStateService) {
  const service = {};

  service.restoreSourceData = restoreSourceData;
  service.zeroOutData = zeroOutData;
  service.deleteRowInternal = deleteRowInternal;
  service.showModal = showModal;
  service.onModalClose = onModalClose;

  function restoreSourceData(row, application, businessUnitName, getFilterFunction) {
    return $q((resolve, reject) => {
      const entity = row.entity;
      const filter = FilterService.getBaseFilter();
      const processData = {
        approval: _getApproval(entity),
        year: filter.year,
        quarter: filter.quarter,
        serviceLine: entity.serviceLine.Name,
        project: entity.account.Name,
      };
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        processData.roadmapItemType = row.entity.roadmapItemType.Name;
      }
      SandboxService.publishSandboxByNode(application, businessUnitName, false).then(() => {
        SandboxService.restoreSourceData(processData).then((response) => {
          $timeout(() => {
            SandboxService.publishSandboxByNode(application, businessUnitName, false).then((response) => {
              resolve();
              NodeStateService.saveNodeState(businessUnitName);
            }, (err) => {
              reject();
            });
          }, 1000);
        }, (err) => {
          reject();
        });
      });
    });
  }

  function zeroOutData(row, application, businessUnitName) {
    return $q((resolve, reject) => {
      const entity = row.entity;
      const filter = FilterService.getBaseFilter();
      const processData = {
        approval: _getApproval(entity),
        year: filter.year,
        quarter: filter.quarter,
        project: entity.account.Name,
        serviceLine: entity.serviceLine.Name,
      };
      if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
        processData.roadmapItemType = row.entity.roadmapItemType.Name;
      }
      SandboxService.publishSandboxByNode(application, businessUnitName, false).then(() => {
        SandboxService.zeroOutData(processData).then((response) => {
          $timeout(() => {
            SandboxService.publishSandboxByNode(application, businessUnitName, false).then((response) => {
              resolve();
              NodeStateService.saveNodeState(businessUnitName);
            }, (err) => {
              reject();
            });
          }, 1000);
        }, (err) => {
          reject();
        });
      });
    });
  }

  function _getApproval(entity) {
    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true) {
      return entity.approval.Name;
    }
    return entity.account.Attributes['RR Approval'];
  }

  function deleteRowInternal(item, row, isAccountAdjustment, getFilterFunction, isMgmt, monthLock) {
    return $q((resolve, reject) => {
      const filter = getFilterFunction();
      isAccountAdjustment = isAccountAdjustment === true;
      if (isAccountAdjustment) {
        filter.account = item.account;
        filter.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.allServiceLines;
      } else if (isMgmt) {
        filter.account = item.account;
        filter.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.allServiceLines;
        filter.node = row.entity.Name;
        //filter.riskCategory = `${item.riskCategory} - 1`;
      } else {
        filter.account = row.entity.account.Name;
        filter.serviceLine = row.entity.serviceLine.Name;
      }
      if (!isMgmt && typeof row.entity.account.Attributes['RR Approval'] !== 'undefined') {
        filter.node = row.entity.account.Attributes['RR Approval'];
      }
      filter.isMgmt = isMgmt;
      const values = [];

      if (!monthLock || !monthLock.month1.locked) {
        item.month1.revenue.value = 0;
        item.month1.cost.value = 0;
        values.push(item.month1.revenue);
        values.push(item.month1.cost);
      }

      if (!monthLock || !monthLock.month2.locked) {
        item.month2.revenue.value = 0;
        item.month2.cost.value = 0;
        values.push(item.month2.revenue);
        values.push(item.month2.cost);
      }

      item.month3.revenue.value = 0;
      item.month3.cost.value = 0;
      item.action.owner.value = '';
      item.action.dueDate.value = '';
      item.action.comment.value = '';
      item.action.richComment.value = '';
      item.action.review.value = '';

      if (typeof item.action.RAG !== 'undefined') item.action.RAG.value = '';

      values.push(item.month3.revenue);
      values.push(item.month3.cost);
      values.push(item.action.owner);
      values.push(item.action.dueDate);
      values.push(item.action.comment);
      if (typeof item.action.RAG !== 'undefined') values.push(item.action.RAG);
      values.push(item.action.richComment);
      values.push(item.action.review);

      
      accountEditCognosService.updateCells(values, filter, (err, data) => {
        $log.info('updateCells ERR', err);
        $log.info('updateCells data', data);
        if (err) {
          reject(err);
        } else {
          const cellFilter = angular.copy(filter);
          let textInfoAccountAdjustment = [];
          values.forEach((i) => {
            switch (i.column) {
              case 'Action Owner':
              case 'Action Due Date':
              case 'Comment':
              case 'Action Comment':
              case 'Action Task_id':
              case 'RAG_load':
                textInfoAccountAdjustment.push(angular.copy(i));
                break;
              default:
                break;
            }
          });
          if (isMgmt) {
            textInfoAccountAdjustment = [];
          }
          cellFilter.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.AADJ;
          cellFilter.account = cellFilter.account.replace('Expected', 'Adjustment');
          accountEditCognosService.updateCells(textInfoAccountAdjustment, cellFilter, (err2) => {
            if (!err2) {
              resolve();
            } else {
              reject(err2);
            }
          });
          resolve(filter);
        }
      });
    });
  }

  function showModal(row, application, businessUnitName, getFilterFunction, callback, modalType) {
    const modalInstance = $uibModal.open({
      animation: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'restoresourcedata-modal',
      templateUrl: 'modal/restoreSourceData/restoreSourceDataTemplate.html',
      controller: 'RestoreSourceDataController',
      controllerAs: '$ctrl',
      resolve: {
        row,
        modalData: {
          application,
          businessUnitName,
          getFilterFunction,
          modalType,
        },
      },
    });

    modalInstance.result.then((data) => {
      let errorModalShowingFlag;
      if (callback) {
        callback(data);
      }
    }, () => {
      let errorModalShowingFlag;
    });
  }

  function onModalClose() {
    // isUnlockModalActive = false;
  }

  return service;
}
