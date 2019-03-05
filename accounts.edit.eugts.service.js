module.exports = AccountsEditEUGTSService;
const angular = require('angular');

AccountsEditEUGTSService.$inject = ['AccountsEditService', 'accountEditCognosService', 'AccountsMergeDataService',
  'fullScreenSpinner', 'busService', '$q'];

function AccountsEditEUGTSService(AccountsEditService, accountEditCognosService,
  AccountsMergeDataService,
  fullScreenSpinner, busService, $q) {
  const vm = this;
  angular.extend(vm, AccountsEditService);
  const newItem = {
    month1: {
      revenue: { value: 0 },
      cost: { value: 0 },
    },
    month2: {
      revenue: { value: 0 },
      cost: { value: 0 },
    },
    month3: {
      revenue: { value: 0 },
      cost: { value: 0 },
    },
    quarter: {
      revenue: { value: 0 },
      cost: { value: 0 },
    },
    action: {
      owner: { column: 'Action Owner' },
      dueDate: { column: 'Action Due Date' },
      taskid: { column: 'Action Task_id'},
      comment: { column: 'Action Comment' },
      richComment: { column: 'Comment' },
      RAG: { column: 'RAG_load' },
      review: { column: 'Review' },
    },
  };

  this.addItem = (items, name) => {
    let account = 'Mgmt Expected - Backlog';
    if (name === 'Signings') {
      account = 'Mgmt Expected - Sign Yield';
    }

    newItem.account = account;
    items.items.push({
      managementExpected: angular.copy(newItem),
      managementApplied: angular.copy(newItem),
      unitRoadmap: angular.copy(newItem),
    });
    items.managementExpected.items.push(angular.copy(newItem));
  };

  this.removeItem = (items, item) => {
    for (let i = 0; i < items.items.length; i += 1) {
      if (items.items[i].$$hashKey === item.$$hashKey) {
        const account = item.managementExpected.account;
        item.managementExpected = Object.assign(item.managementExpected, newItem);
        item.managementExpected.account = account;
        return;
      }
    }
  };

  vm.runMgmt = (row, getFilter, filter, deferred) => {
    this.run('commit', 'signings', 'Risk-1', true, row, false, getFilter).then(() => {
      fullScreenSpinner.hide();
      const roadmapAdjustmentUpdatedEvent = {
        filter,
        row,
      };
      busService.publish(busService.events.ROADMAP_MGMT_ADJUSTMENT_UPDATED,
        roadmapAdjustmentUpdatedEvent);
      deferred.resolve();
    }, deferred.reject);
  };

  vm.run = (tab, type, accAdjRiskCategory, isMgmtJudgement,
    row, isAccountAdjustment, getFilter) => {
    const deferredRun = $q.defer();
    let itemData;
    let cellsToUpdate;
    const updateArray = [];
    if (isMgmtJudgement) {
      let backup;
      if (angular.isDefined(row.backup.managementJudgement[tab][type].managementExpected)) {
        backup = row.backup.managementJudgement[tab][type].managementExpected;
      }
      cellsToUpdate = this.getChangedValues(
        row.entity.managementJudgement[tab][type].managementExpected,
        backup, undefined, true, false);
      itemData = row.entity.managementJudgement[tab][type].managementExpected;
      itemData.roadmapItemType = 'Other';
      if (cellsToUpdate.length > 0 && itemData.roadmapItemType !== '') {
        updateArray.push({
          cellsToUpdate,
          itemData,
          riskCategory: accAdjRiskCategory,
          isMgmt: true,
        });
      }
    } else if (!isAccountAdjustment) {
      for (let index = 0; index < row.entity[tab][type].items.length; index += 1) {
        cellsToUpdate = this.getChangedValues(row.entity[tab][type].items[index],
          row.backup[tab][type].items[index], undefined, undefined, true);
        itemData = row.entity[tab][type].items[index];
        if (cellsToUpdate.length > 0) {
          updateArray.push({
            cellsToUpdate,
            itemData,
            isMgmt: false,
          });
        }
      }
    } else {
      cellsToUpdate = this.getChangedValues(
        row.entity.accountAdjustments[tab][type].accountExpected,
        row.backup.accountAdjustments[tab][type].accountExpected);
      itemData = row.entity.accountAdjustments[tab][type].accountExpected;
      // all data should go to Other roadmap item type
      itemData.roadmapItemType = 'Other';
      if (cellsToUpdate.length > 0) {
        updateArray.push({
          cellsToUpdate,
          itemData,
          riskCategory: accAdjRiskCategory,
          isMgmt: false,
          type,
        });
      }
    }
    const executeUpdates = (index) => {
      if (index >= updateArray.length) {
        deferredRun.resolve();
      } else if (!isAccountAdjustment && !isMgmtJudgement) {
        this.saveItemChangeSingleCall(updateArray[index].itemData, row, getFilter).then(() => {
          executeUpdates(index + 1);
        }, (err) => {
          deferredRun.reject(err);
        });
      } else {
        this.updateCells(updateArray[index].cellsToUpdate, updateArray[index].itemData,
          row, getFilter, isAccountAdjustment, updateArray[index].riskCategory,
          updateArray[index].isMgmt)
          .then(
            () => {
              executeUpdates(index + 1);
            }, (err) => {
              deferredRun.reject(err);
            },
          );
      }
    };

    executeUpdates(0);
    return deferredRun.promise;
  };
}
