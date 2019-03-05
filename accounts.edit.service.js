module.exports = AccountsEditService;

const angular = require('angular');

AccountsEditService.$inject = ['accountEditCognosService', 'fullScreenSpinner', 'CognosDimentionService',
  'utilsService', '$q', 'CognosService', 'busService', 'RestoreSourceDataService', 'ErrorService', '$log', 'AccountsMergeDataService', 'UserSettingsService', 'FilterService'];

function AccountsEditService(accountEditCognosService, fullScreenSpinner, CognosDimentionService,
  utilsService, $q, CognosService, busService, RestoreSourceDataService,
  ErrorService, $log, AccountsMergeDataService, UserSettingsService, FilterService) {
  const service = {};
  service.addItem = addItem;
  service.saveChanges = saveChanges;
  service.deleteRow = deleteRow;
  service.cancelChanges = cancelChanges;
  service.saveItemChange = saveItemChange;
  service.saveItemChangeSingleCall = saveItemChangeSingleCall;
  service.moveItem = moveItem;
  service.getFilterFromFnction = getFilterFromFnction;
  service.run = run;
  service.runMgmt = runMgmt;
  service.getChangedValues = getChangedValues;
  service.updateCells = updateCells;
  service.saveItemChangeSingleCallForSplitRdmp = saveItemChangeSingleCallForSplitRdmp;

  const columnNames = CognosDimentionService.columns.RR_INPUT;

  function updateCells(cellsToUpdate, itemData, row, getFilter,
    isAccountAdjustment, accAdjRiskCategory, isMgmt) {
    return $q((resolve, reject) => {
      function onError(ex) {
        $log.error(ex);
        reject(ex);
      }
      let textInfoAccountAdjustment = [];
      if (cellsToUpdate.length > 0) {
        const filters = getFilter();
        cellsToUpdate.forEach((el) => {
          switch (el.column) {
            case 'Action Owner':
            case 'Action Due Date':
            case 'Action Comment':
            case 'Action Task_id':
            case 'Comment':
            case 'RAG_load':
              textInfoAccountAdjustment.push(angular.copy(el));
              break;
            default:
              break;
          }
        });

        if (isAccountAdjustment) {
          filters.account = itemData.account;
          filters.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.allServiceLines;
          filters.roadmapItemType = itemData.roadmapItemType;
        } else if (isMgmt) {
          filters.account = itemData.account;
          filters.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.allServiceLines;
          filters.node = row.entity.Name;
          filters.roadmapItemType = itemData.roadmapItemType;
        } else {
          filters.account = row.entity.account.Name;
          filters.serviceLine = row.entity.serviceLine.Name;
        }
        const cellFilter = angular.copy(filters);
        if (!isMgmt) {
          if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true && row.entity.approval
            && row.entity.approval.Name) {
            cellFilter.node = row.entity.approval.Name;
          } else if (typeof row.entity.account.Attributes['RR Approval'] !== 'undefined') {
            cellFilter.node = row.entity.account.Attributes['RR Approval'];
          }
        }
        cellFilter.riskCategory = accAdjRiskCategory;
        cellFilter.isMgmt = isMgmt;

        const itemColumnsMgmtEuGts = [
          columnNames.revenueMjdg_Qtr, columnNames.costMjdg_Qtr, 
          columnNames.actionComment,columnNames.actionTask,columnNames.actionOwner, columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment, columnNames.underscore, /* columnNames.review,  */
        ];

        const uiData =
          checkAndSetToOriginalValue(AccountsMergeDataService.convertUiModelToEditItem(itemData, isMgmt, UserSettingsService.isEuGtsRegion()));
        const accAdjCellFilter = angular.copy(cellFilter);
        accountEditCognosService.getItemForEdit(cellFilter, isMgmt && UserSettingsService.isEuGtsRegion() ? itemColumnsMgmtEuGts : undefined).then((data) => {
          const dataToUpdate = { data: uiData };
          dataToUpdate.name = cellFilter.riskCategory;
          cellFilter.queryID = data.queryID;
          accountEditCognosService.updateItem(dataToUpdate, cellFilter).then(() => {
            if (textInfoAccountAdjustment.length > 0) {
              const itemColumns = [
                columnNames.actionComment, columnNames.actionTask, columnNames.actionOwner,
                columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment,
              ];
              if (isMgmt) {
                accAdjCellFilter.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.MJDG;
                accAdjCellFilter.account = cellFilter.account.replace('Expected', 'Judgement');
                accAdjCellFilter.approval = 'Non cluster';
              } else {
                accAdjCellFilter.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.AADJ;
                accAdjCellFilter.account = cellFilter.account.replace('Expected', 'Adjustment');
              }

              accountEditCognosService.getItemForEdit(accAdjCellFilter, itemColumns).then(
                (dataObject) => {
                  const uiAccAdjData =
                    checkAndSetToOriginalValue(AccountsMergeDataService
                      .convertUiModelToEditItemAccountAdjustment(itemData));
                  const dataTextToUpdate = { data: uiAccAdjData };
                  dataTextToUpdate.name = accAdjCellFilter.riskCategory;
                  accAdjCellFilter.queryID = dataObject.queryID;
                  accountEditCognosService.updateItem(dataTextToUpdate, accAdjCellFilter).then(
                    () => {
                      resolve();
                    }).catch(onError);
                }).catch(onError);
            } else {
              resolve();
            }
          }).catch(onError);
        }).catch(onError);
      }
    });
  }

  function getChangedValues(data, originalData, fieldName, checkQuarterValue, checkReviewValue) {
    const values = [];
    let isNewValue = false;
    let originalDate;
    let newDate;
    let returnDateTime;
    if (typeof originalData === 'undefined') {
      isNewValue = true;
    }
    if (angular.isDefined(fieldName)) {
      if (fieldName === 'action.dueDate') {
        newDate = new Date(data.action.dueDate.displayValue);
        if (!isNewValue) originalDate = new Date(originalData.action.dueDate.displayValue);

        if (isNewValue || newDate.getTime() !== originalDate.getTime()) {
          returnDateTime = 25569.0 +
            ((newDate.getTime() - (newDate.getTimezoneOffset() * 60 * 1000))
              / (1000 * 60 * 60 * 24));

          data.action.dueDate.value = returnDateTime.toString().substr(0, 5);
          values.push(data.action.dueDate);
          // value.push(43100);
        }
      } else if (isNewValue || utilsService.byString(data, fieldName).value !==
        utilsService.byString(originalData, fieldName).value) {
        values.push(utilsService.byString(data, fieldName));
      }
    } else {
      if (isNewValue || data.month1.revenue.value !== originalData.month1.revenue.value) {
        values.push(data.month1.revenue);
      }
      if (isNewValue || data.month2.revenue.value !== originalData.month2.revenue.value) {
        values.push(data.month2.revenue);
      }
      if (isNewValue || data.month3.revenue.value !== originalData.month3.revenue.value) {
        values.push(data.month3.revenue);
      }
      if (isNewValue || data.month3.revenue.value !== originalData.month3.revenue.value) {
        values.push(data.month3.revenue);
      }
      if (isNewValue || (data.quarter && data.quarter.revenue.value !== originalData.quarter.revenue.value && checkQuarterValue === true)) {
        if (data.quarter) values.push(data.quarter.revenue);
      }
      if (isNewValue || data.month1.cost.value !== originalData.month1.cost.value) {
        values.push(data.month1.cost);
      }
      if (isNewValue || data.month2.cost.value !== originalData.month2.cost.value) {
        values.push(data.month2.cost);
      }
      if (isNewValue || data.month3.cost.value !== originalData.month3.cost.value) {
        values.push(data.month3.cost);
      }
      if (isNewValue || (data.quarter && data.quarter.cost.value !== originalData.quarter.cost.value && checkQuarterValue === true)) {
        if (data.quarter) values.push(data.quarter.cost);
      }
      if (isNewValue || data.action.owner.value !== originalData.action.owner.value) {
        values.push(data.action.owner);
      }
      if (isNewValue || data.action.dueDate.displayValue === null) {
        data.action.dueDate.value = null;
        values.push(data.action.dueDate);
      } else {
        newDate = new Date(data.action.dueDate.displayValue);
        if (!isNewValue) originalDate = new Date(originalData.action.dueDate.displayValue);

        if (isNewValue || newDate.getTime() !== originalDate.getTime()) {
          // data.action.dueDate.value = 43100;
          returnDateTime = 25569.0 +
            ((newDate.getTime() - (newDate.getTimezoneOffset() * 60 * 1000))
              / (1000 * 60 * 60 * 24));

          data.action.dueDate.value = returnDateTime.toString().substr(0, 5);
          values.push(data.action.dueDate);
          // value.push(43100);
        }
      }
      if (isNewValue || data.action.comment.value !== originalData.action.comment.value) {
        values.push(data.action.comment);
      }
      if (isNewValue || data.action.taskid.value !== originalData.action.taskid.value) {
        values.push(data.action.taskid);
      }
      if (isNewValue || data.action.richComment.value !== originalData.action.richComment.value) {
        values.push(data.action.richComment);
      }
      if (isNewValue || (originalData.action.RAG !== data.action.RAG) ||
        (data.action.RAG && data.action.RAG.value !== originalData.action.RAG.value)) {
        values.push(data.action.RAG);
      }

      if (checkReviewValue && originalData && originalData.actionData &&
        originalData.action.review && data.action.review) {
        if (isNewValue || (originalData.action.review !== data.action.review) ||
          (data.action.review && data.action.review.value !== originalData.action.review.value)) {
          values.push(data.action.review);
        }
      } 
    }
    return values;
  }

  /**
  * Save item changes witch a single query (optimization)
  * Developed for item adjustment.
  */
  function saveItemChangeSingleCall(item, row, getFilter) {
    const deferred = $q.defer();
    const filter = getFilterFromFnction(getFilter, row);
    filter.riskCategory = item.name;
    const uiData =
      checkAndSetToOriginalValue(AccountsMergeDataService.convertUiModelToEditItem(item, false, UserSettingsService.isEuGtsRegion()));
    accountEditCognosService.getItemForEdit(filter).then((data) => {
      const underscoreOrdinal = UserSettingsService.isEuGtsRegion() ? 12 : 11; 
      uiData[CognosDimentionService.columns.RR_INPUT.underscore_one] = { value: 1, ordinal: underscoreOrdinal };
      const dataToUpdate = { data: uiData };
      dataToUpdate.name = filter.riskCategory;
      filter.queryID = data.queryID;
      accountEditCognosService.updateItem(dataToUpdate, filter).then(() => {
        deferred.resolve();
      }).catch(onError);
    }).catch(onError);

    return deferred.promise;
  }

  /**
  * Save item changes witch a single query (optimization)
  * Developed for item adjustment.
  */
 function saveItemChangeSingleCallForSplitRdmp(uiData, columns, rowEntity) {
  const filter = getFilterForSaving(rowEntity);
  const deferred = $q.defer();
  accountEditCognosService.getItemForEdit(filter, columns).then((data) => {
    const dataToUpdate = { data: uiData };
    dataToUpdate.name = filter.riskCategory;
    filter.queryID = data.queryID;
    accountEditCognosService.updateItem(dataToUpdate, filter).then(() => {
      deferred.resolve();
    }).catch(onError);
  }).catch(onError);


  return deferred.promise;
}

function getFilterForSaving(data) {
  const filter = FilterService.getBaseFilter();
  if (data) {
    filter.account = data.account ?  data.account.Name : '';
    filter.serviceLine = data.serviceLine ?  data.serviceLine.Name : '';
    filter.roadmapItemType = data.roadmapItemType ?  data.roadmapItemType.Name : '';
    filter.node = data.approval ?  data.approval.Name : '';
    filter.riskCategory = data.revenueRiskCategory ?  data.revenueRiskCategory.Name : '';
  }
  filter.isMgmt = true;
  return filter; 
}

function onError(ex) {
  $log.error(ex);
  deferred.reject(ex);
}

  function checkAndSetToOriginalValue(rows) {
    const data = angular.copy(rows);
    function checkAndSet(name) {
      if (typeof data[name] !== 'undefined' && data[name].value === utilsService.formatNumber(data[name].originalValue)) {
        data[name].value = data[name].originalValue;
      }
    }
    checkAndSet('M1 Cost');
    checkAndSet('M2 Cost');
    checkAndSet('M3 Cost');
    checkAndSet('M1 Rev');
    checkAndSet('M2 Rev');
    checkAndSet('M3 Rev');
    return data;
  }

  function saveItemChange(item, row, getFilter, tab, type,
    index, isAccountAdjustment, isAddOperation, fieldName) {
    if (angular.isDefined(tab) && angular.isDefined(type)) {
      fullScreenSpinner.show();
      let cellsToUpdate;
      let itemData = item;
      if (!isAccountAdjustment) {
        cellsToUpdate = getChangedValues(item, row.backup[tab][type].items[index], fieldName);
      } else {
        cellsToUpdate = getChangedValues(row.entity.accountAdjustments[tab][type].accountExpected,
          row.backup.accountAdjustments[tab][type].accountExpected, fieldName);
        itemData = row.entity.accountAdjustments[tab][type].accountExpected;
      }
      if (cellsToUpdate.length > 0) {
        updateCells(cellsToUpdate, itemData, row, getFilter,
          isAccountAdjustment, isAddOperation)
          .then(() => {
            row.backup = angular.copy(row.entity);
            fullScreenSpinner.hide();
          });
      }
    }
  }

  function cancelChanges(row) {
    row.entity = angular.copy(row.backup);
  }

  function deleteRow(item, row, getFilter, isAccountAdjustment, dontUpdate, isMgmt, monthLock) {
    return $q((resolve, reject) => {
      fullScreenSpinner.show();
      RestoreSourceDataService.deleteRowInternal(item, row, isAccountAdjustment, getFilter, isMgmt, monthLock)
        .then(() => {
          fullScreenSpinner.hide();
          row.backup = angular.copy(row.entity);
          const filters = angular.copy(getFilter());
          if (isAccountAdjustment) {
            filters.account = item.account;
            filters.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.allServiceLines;
          } else if (isMgmt) {
            filters.account = item.account;
            filters.serviceLine = CognosDimentionService.serviceLines.RR_INPUT.allServiceLines;
          } else {
            filters.account = row.entity.account.Name;
            filters.serviceLine = row.entity.serviceLine.Name;
          }
          if (isAccountAdjustment) {
            const roadmapAdjustmentUpdatedEvent = {
              filter: filters,
              row,
            };
            busService.publish(busService.events.ROADMAP_ADJUSTMENT_UPDATED,
              roadmapAdjustmentUpdatedEvent);
            resolve();
          } else if (isMgmt) {
            const roadmapManagementAdjustmentUpdatedEvent = {
              filter: filters,
              row,
            };
            busService.publish(busService.events.ROADMAP_MGMT_ADJUSTMENT_UPDATED,
              roadmapManagementAdjustmentUpdatedEvent);
            resolve();
          } else {
            const filter = filters;
            filter.riskCategory = item.name;
            const roadmapItemUpdatedEvent = {
              filter,
              row,
            };
            $log.info('roadmapItemUpdatedEvent', roadmapItemUpdatedEvent);
            if (!dontUpdate) {
              busService.publish(busService.events.ROADMAP_ITEM_UPDATED,
                roadmapItemUpdatedEvent);
            }
            resolve();
          }
        }, (err) => {
          fullScreenSpinner.hide();
          ErrorService.handleError(err);
          reject(err);
        });
    });
  }

  /**
    * Gets a query filter with correct values preset for a row.
    */
  function getFilterFromFnction(fn, row) {
    const filter = angular.copy(fn());
    filter.account = row.entity.account.Name;
    filter.serviceLine = row.entity.serviceLine.Name;

    if (CognosService.CognosConfigService.prop.COV_ID_FLAG === true &&
      row.entity.approval && row.entity.approval.Name) {
      filter.node = row.entity.approval.Name;
    } else if (typeof row.entity.account.Attributes['RR Approval'] !== 'undefined') {
      filter.node = row.entity.account.Attributes['RR Approval'];
    }
    if (CognosService.CognosConfigService.prop.USE_EXTRA_ROADMAP_ITEM_TYPE_DIMENSION === true) {
      filter.roadmapItemType = row.entity.roadmapItemType.Name;
    }
    return filter;
  }

  function getRowIndex(rowId) {
    const index = rowId.substr(rowId.indexOf(' - ') + 3);
    return index;
  }

  function onError(ex) {
    fullScreenSpinner.hide();
    ex.errorSource = ErrorService.errorSource.cognos;
    ex.type = ErrorService.errorTypes.technical;
    ex.date = new Date();
    ex.source = ErrorService.errorSource.cognos;
    ex.originalError = ex;
    ex.data.status = ex.status;
    ex.data.statusText = ex.statusText;
    ErrorService.handleError(ex);
  }

  function addItemInternal(pRiskCategory, currentDetails, getFilter, row) {
    if (angular.isDefined(pRiskCategory)) {
      const filter = getFilterFromFnction(getFilter, row);
      filter.riskCategory = pRiskCategory;
      $log.debug('pRiskCategory', pRiskCategory);
      accountEditCognosService.getItemForEdit(filter).then((data) => {
        const dataToUpdate = { data: data.data[0] };
        dataToUpdate.name = filter.riskCategory;
        delete dataToUpdate.revenueRiskCategory;
        filter.queryID = data.queryID;
        accountEditCognosService.updateItem(dataToUpdate, filter).then(() => {
          dataToUpdate.expended = true;
          const newItem = AccountsMergeDataService.convertEditItemToUiModel(dataToUpdate);
          currentDetails.items.push(newItem);
          fullScreenSpinner.hide();
        }).catch(onError);
      }).catch(onError);
    }
  }

  /**
    * Adds Item for opportunity.
    */
  function addItem(currentDetails, row, getFilter) {
    fullScreenSpinner.show();
    let index = 1;
    if (angular.isDefined(currentDetails.items) && currentDetails.items.length !== 0) {
      index = getRowIndex(currentDetails.items[currentDetails.items.length - 1].name);
      index = parseInt(index, 10) + 1;
    }

    if (index <= 10) {
      const pRiskCategory = `${currentDetails.name} - ${index}`;
      addItemInternal(pRiskCategory, currentDetails, getFilter, row);
    } else {
      const newRowFilter = getFilterFromFnction(getFilter, row);
      accountEditCognosService.getNextItemIndex(currentDetails.name, newRowFilter,
        (err, pRiskCategory) => {
          addItemInternal(pRiskCategory, currentDetails, getFilter, row);
        });
    }
  }

  function moveItem(item, moveToDetails, row, getFilter) {
    return $q((resolve) => {
      if (item.name.split(' ')[0] === moveToDetails.name) return;

      const newItem = angular.copy(item);
      const oldItemName = item.name.split(' ')[0];
      let oldItemIndex = 0;

      switch (oldItemName) {
        case 'Solid':
          row.entity.commitTabData.solid.items.forEach((itm, i) => {
            if (itm.name === item.name) oldItemIndex = i;
          });
          row.entity.commitTabData.solid.items.splice(oldItemIndex, 1);
          break;
        case 'Risk':
          row.entity.commitTabData.risk.items.forEach((itm, i) => {
            if (itm.name === item.name) oldItemIndex = i;
          });
          row.entity.commitTabData.risk.items.splice(oldItemIndex, 1);
          break;
        case 'Stretch':
          row.entity.bestCanDoTabData.stretch.items.forEach((itm, i) => {
            if (itm.name === item.name) oldItemIndex = i;
          });
          row.entity.bestCanDoTabData.stretch.items.splice(oldItemIndex, 1);
          break;
        default:
          break;
      }

      let lastToName;
      let moveToName;

      if (moveToDetails.items.length > 0) {
        lastToName = moveToDetails.items[moveToDetails.items.length - 1].name;
        moveToName = `${lastToName.slice(0, -1)}${parseInt(lastToName.slice(-1), 10) + 1}`;
      } else {
        moveToName = `${moveToDetails.name} - 1`;
      }

      function changeRowName(obj) {
        Object.keys(obj).forEach((o) => {
          if (o === 'row') obj[o] = moveToName;
          if (typeof obj[o] !== 'object' || obj[o] === null) return;
          changeRowName(obj[o]);
        });
      }
      changeRowName(newItem);
      newItem.name = moveToName;
      moveToDetails.items.push(newItem);

      const filters = angular.copy(getFilter());

      filters.account = row.entity.account.Name;
      filters.serviceLine = row.entity.serviceLine.Name;
      const filter = filters;
      filter.riskCategory = item.name;
      const roadmapItemUpdatedEvent = {
        filter,
        row,
      };


      service.deleteRow(item, row, getFilter, false, true).then(() => {
        service.saveChanges(row, getFilter, false).then(() => {
          row.backup = angular.copy(row.entity);
          busService.publish(busService.events.ROADMAP_ITEM_UPDATED, roadmapItemUpdatedEvent);
          resolve();
        });
      });
    });
  }

  function saveChanges(row, getFilter, isAccountAdjustment, isMgmt, updateOnlyCommitData) {
    const deferred = $q.defer();

    fullScreenSpinner.show();

    const filter = angular.copy(getFilter());
    if (isMgmt) {
      this.runMgmt(row, getFilter, filter, deferred);
    } else if (!isAccountAdjustment) {
      this.run('commitTabData', 'solid', null, false, row, false, getFilter).then(() => {
        this.run('commitTabData', 'risk', null, false, row, false, getFilter).then(() => {
          this.run('bestCanDoTabData', 'stretch', null, false, row, false, getFilter).then(() => {
            fullScreenSpinner.hide();
            deferred.resolve();
          }, deferred.reject);
        }, deferred.reject);
      }, deferred.reject);
    } else {
      this.run('commit', 'backlog', 'Risk-1', false, row, true, getFilter).then(() => {
        this.run('commit', 'signings', 'Risk-1', false, row, true, getFilter).then(() => {
          this.run('bestCanDo', 'backlog', 'Stretch-1', false, row, true, getFilter).then(() => {
            this.run('bestCanDo', 'signings', 'Stretch-1', false, row, true, getFilter).then(() => {
              fullScreenSpinner.hide();
              const roadmapAdjustmentUpdatedEvent = {
                filter,
                row,
              };
              busService.publish(busService.events.ROADMAP_ADJUSTMENT_UPDATED,
                roadmapAdjustmentUpdatedEvent);
              deferred.resolve();
            }, deferred.reject);
          }, deferred.reject);
        }, deferred.reject);
      }, deferred.reject);
    }

    return deferred.promise;
  }

  function run(tab, type, accAdjRiskCategory, isMgmtJudgement, row, isAccountAdjustment, getFilter) {
    const deferredRun = $q.defer();
    let itemData;
    let cellsToUpdate;
    const updateArray = [];
    if (isMgmtJudgement) {
      // next block supports EU GTS MGMT data
      cellsToUpdate = getChangedValues(
        row.entity.managementJudgement[tab][type].managementExpected,
        row.backup.managementJudgement[tab][type].managementExpected);
      itemData = row.entity.managementJudgement[tab][type].managementExpected;
      itemData.roadmapItemType = 'Backlog';
      if (type === 'signings') {
        itemData.roadmapItemType = 'Other';
      }
      if (cellsToUpdate.length > 0) {
        updateArray.push({
          cellsToUpdate,
          itemData,
          riskCategory: accAdjRiskCategory,
          isMgmt: true,
        });
      }
    } else if (!isAccountAdjustment) {
      for (let index = 0; index < row.entity[tab][type].items.length; index += 1) {
        cellsToUpdate = getChangedValues(row.entity[tab][type].items[index],
          row.backup[tab][type].items[index]);
        itemData = row.entity[tab][type].items[index];
        if (cellsToUpdate.length > 0) {
          updateArray.push({
            cellsToUpdate,
            itemData,
            riskCategory: accAdjRiskCategory,
            isMgmt: false,
          });
        }
      }
    } else {
      cellsToUpdate = getChangedValues(row.entity.accountAdjustments[tab][type].accountExpected,
        row.backup.accountAdjustments[tab][type].accountExpected);
      itemData = row.entity.accountAdjustments[tab][type].accountExpected;
      itemData.roadmapItemType = 'Backlog';
      if (type === 'signings') {
        itemData.roadmapItemType = 'Other';
      }
      if (cellsToUpdate.length > 0) {
        updateArray.push({
          cellsToUpdate,
          itemData,
          riskCategory: accAdjRiskCategory,
          isMgmt: false,
        });
      }
    }

    const executeUpdates = (index) => {
      if (index >= updateArray.length) {
        deferredRun.resolve();
      } else if (!isAccountAdjustment && !isMgmtJudgement) {
        saveItemChangeSingleCall(updateArray[index].itemData, row, getFilter).then(() => {
          executeUpdates(index + 1);
        }, (err) => {
          deferredRun.reject(err);
        });
      } else {
        updateCells(updateArray[index].cellsToUpdate, updateArray[index].itemData,
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
  }

  function runMgmt(row, getFilter, filter, deferred) {
    run('commit', 'backlog', 'Risk-1', true, row, false, getFilter).then(() => {
      run('commit', 'signings', 'Risk-1', true, row, false, getFilter).then(() => {
        run('bestCanDo', 'backlog', 'Stretch-1', true, row, false, getFilter).then(() => {
          run('bestCanDo', 'signings', 'Stretch-1', true, row, false, getFilter).then(() => {
            fullScreenSpinner.hide();
            const roadmapAdjustmentUpdatedEvent = {
              filter,
              row,
            };
            busService.publish(busService.events.ROADMAP_MGMT_ADJUSTMENT_UPDATED,
              roadmapAdjustmentUpdatedEvent);
            deferred.resolve();
          }, deferred.reject);
        }, deferred.reject);
      }, deferred.reject);
    }, deferred.reject);
  }

  return service;
}
