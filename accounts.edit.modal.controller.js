
module.exports = AccountsEditModalController;

AccountsEditModalController.$inject = ['$scope', '$uibModalInstance', 'input',
  'accountEditCognosService', 'busService', 'fullScreenSpinner', 'ErrorService', 'utilsService', 'CognosService'];
function AccountsEditModalController($scope, $uibModalInstance, input,
  accountEditCognosService, busService, fullScreenSpinner, ErrorService, utilsService, CognosService) {
  const $ctrl = this;
  $ctrl.validation = {
    maxAmountLength: 13,
    amountPattern: new RegExp('^-?\\d{0,3}(\\.\\d{0,6})?$'),
  };
  $ctrl.input = input;
  if (input.isAdd) {
    $ctrl.data = prepareDataForAdd(angular.copy(input.data));
  } else {
    $ctrl.data = angular.copy(input.data);
  }
  $ctrl.allData = angular.copy(input.allData);
  try {
    $ctrl.originalData = JSON.parse(JSON.stringify($ctrl.data));
  } catch (error) {
    throw new Error(`JSON.parse error at acc edit modal controller: ${error.message}`);
  }
  if ($ctrl.data.action.dueDate && $ctrl.data.action.dueDate.value) {
    const dueDate = utilsService.formatDateFromCognos($ctrl.data.action.dueDate.value);// new Date(($ctrl.data.action.dueDate.value - (25567 + 1))*86400*1000);
    $ctrl.data.action.dueDate.value = dueDate;
  }
  $ctrl.recalculatedValues = {
    quarterRevenue: 0,
    quarterCost: 0,
    quartercGPAmount: 0,
    quartercGPProcents: 0,
  };

  if (!$ctrl.input.isAdd) {
    recalculateTotals();
  }
  $ctrl.ok = function (form) {
    if (checkIfFormIsValid(form)) {
      if ($scope.dt) {
        const returnDateTime = 25569.0 + (($scope.dt.getTime() - ($scope.dt.getTimezoneOffset() * 60 * 1000)) / (1000 * 60 * 60 * 24));
        $ctrl.data.action.dueDate.value = returnDateTime.toString().substr(0, 5);
      } else {
        $ctrl.data.action.dueDate.value = null;
      }
      const cellsToUpdate = getChangedValues($ctrl.data, $ctrl.originalData);
      fullScreenSpinner.show();

      const cellFilter = angular.copy($ctrl.input.filter);
      if (CognosService.CognosConfigService.prop.COV_ID_FLAG == true && input.row.entity.approval && input.row.entity.approval.Name) {
        cellFilter.node = input.row.entity.approval.Name;
      } else if (typeof input.row.entity.account.Attributes['RR Approval'] !== 'undefined') {
        cellFilter.node = input.row.entity.account.Attributes['RR Approval'];
      }

      accountEditCognosService.updateCells(cellsToUpdate, cellFilter, (err, data) => {
        fullScreenSpinner.hide();
        if (err) {
          if (!utilsService.checkMissingAccountsSubsetCase(err, 'CubeCellWriteStatusElementNoWriteAccess')) {
            ErrorService.handleError(err);
          } else {
            ErrorService.showErrorModal('User has not write access. Please contact the support.');
          }
        } else {
          if ($ctrl.input.isAccountAdjustment) {
            const roadmapAdjustmentUpdatedEvent = {
              filter: $ctrl.input.filter,
              row: $ctrl.input.row,
            };
            busService.publish(busService.events.ROADMAP_ADJUSTMENT_UPDATED, roadmapAdjustmentUpdatedEvent);
          } else {
            $ctrl.input.filter.riskCategory = $ctrl.data.name;
            const roadmapItemUpdatedEvent = {
              filter: $ctrl.input.filter,
              row: $ctrl.input.row,
            };
            busService.publish(busService.events.ROADMAP_ITEM_UPDATED, roadmapItemUpdatedEvent);
          }
          $uibModalInstance.close('ok');
        }
      });
    }
  };

  $ctrl.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };

  $ctrl.onChange = function (changedCell, form) {
    if (checkIfFormIsValid(form)) {
      recalculateTotals(changedCell);
      $ctrl.anyInput = true;
    }
  };

  $ctrl.onLeave = function (item, form) {
    console.log('onLeave', item, form.$valid);
  };

  function checkIfFormIsValid(form) {
    if (form.revenueMonth1.$valid && form.revenueMonth2.$valid && form.revenueMonth3.$valid &&
            form.costMonth1.$valid && form.costMonth2.$valid && form.costMonth3.$valid) {
            /* if (typeof form.RAG !== "undefined") {
                if (form.RAG.$viewValue !== '' && form.actionComment.$viewValue === '') {
                    return false;
                }
            } */
      if (form.actionComment.$viewValue === '') {
        return false;
      }
      return true;
    }
    return false;
  }
  $ctrl.checkIfFormIsValid = checkIfFormIsValid;

  function checkIfAccountAdjustmentHasAnyValue(data) {
    if (Number(data.month1.revenue.value) !== 0 || Number(data.month2.revenue.value) || Number(data.month3.revenue.value) ||
            Number(data.month1.cost.value) !== 0 || Number(data.month2.cost.value) || Number(data.month3.cost.value)) {
      return true;
    }
    return false;
  }

  function recalculateTotals(changedCell) {
    if ($ctrl.input.isAccountAdjustment) {
      recalculateTotalsForAccountAdjustments($ctrl.data);
      if (checkIfAccountAdjustmentHasAnyValue($ctrl.data)) {
        $ctrl.anyInput = true;
      }
    } else {
      recalculateTotalsForAccount($ctrl.allData.items, changedCell);
      $ctrl.anyInput = true;
    }
  }

  function prepareDataForAdd(currentDetails) {
    let index = 1;
    if (currentDetails.items !== undefined && currentDetails.items.length !== 0) {
      index = currentDetails.items.length + 1;
    }
    const rowName = `${currentDetails.name} - ${index}`;
    return accountEditCognosService.getEmptyObject(rowName);
  }

  function getChangedValues(data, originalData) {
    const values = [];
    if (data.month1.revenue.value !== originalData.month1.revenue.value) {
      values.push(data.month1.revenue);
    }
    if (data.month2.revenue.value !== originalData.month2.revenue.value) {
      values.push(data.month2.revenue);
    }
    if (data.month3.revenue.value !== originalData.month3.revenue.value) {
      values.push(data.month3.revenue);
    }
    if (data.month1.cost.value !== originalData.month1.cost.value) {
      values.push(data.month1.cost);
    }
    if (data.month2.cost.value !== originalData.month2.cost.value) {
      values.push(data.month2.cost);
    }
    if (data.month3.cost.value !== originalData.month3.cost.value) {
      values.push(data.month3.cost);
    }
    if (data.action.owner.value !== originalData.action.owner.value) {
      values.push(data.action.owner);
    }
    if (data.action.dueDate.value !== originalData.action.dueDate.value) {
            // data.action.dueDate.value = 43100;
      values.push(data.action.dueDate);
            // value.push(43100);
    }
    if (data.action.comment.value !== originalData.action.comment.value) {
      values.push(data.action.comment);
    }
    if (data.action.taskid.value !== originalData.action.taskid.value) {
      values.push(data.action.taskid);
    }
    if ((typeof originalData.action.RAG === 'undefined' && typeof data.action.RAG !== 'undefined') ||
            (data.action.RAG && data.action.RAG.value !== originalData.action.RAG.value)) {
      values.push(data.action.RAG);
    }
    return values;
  }

  function recalculateTotalsForAccount(items, changedCell) {
    let quarterRevenue = 0;
    let quarterCost = 0;
    let quartercGPAmount = 0;
    let quartercGPProcents = 0;
    items.forEach((e) => {
      updateCellIfNeeded(e, changedCell);
      const itemQuarterRevenue = Number(e.month1.revenue.value) + Number(e.month2.revenue.value) + Number(e.month3.revenue.value);
      const itemQuarterCost = Number(e.month1.cost.value) + Number(e.month2.cost.value) + Number(e.month3.cost.value);
      quarterRevenue += itemQuarterRevenue;
      quarterCost += itemQuarterCost;
      if (changedCell !== undefined && e.name === changedCell.row) {
        $ctrl.data.month1.cGPAmount.value = calculatecGPAmount(e.month1.revenue.value, e.month1.cost.value);
        $ctrl.data.month2.cGPAmount.value = calculatecGPAmount(e.month2.revenue.value, e.month2.cost.value);
        $ctrl.data.month3.cGPAmount.value = calculatecGPAmount(e.month3.revenue.value, e.month3.cost.value);
        $ctrl.data.month1.cGPProcents.value = calculatecGPProcents(e.month1.revenue.value, e.month1.cost.value);
        $ctrl.data.month2.cGPProcents.value = calculatecGPProcents(e.month2.revenue.value, e.month2.cost.value);
        $ctrl.data.month3.cGPProcents.value = calculatecGPProcents(e.month3.revenue.value, e.month3.cost.value);
      }
    });
    if ($ctrl.input.isAdd) {
      const itemQuarterRevenue = Number($ctrl.data.month1.revenue.value) + Number($ctrl.data.month2.revenue.value) + Number($ctrl.data.month3.revenue.value);
      const itemQuarterCost = Number($ctrl.data.month1.cost.value) + Number($ctrl.data.month2.cost.value) + Number($ctrl.data.month3.cost.value);
      quarterRevenue += itemQuarterRevenue;
      quarterCost += itemQuarterCost;
      $ctrl.data.month1.cGPAmount.value = calculatecGPAmount($ctrl.data.month1.revenue.value, $ctrl.data.month1.cost.value);
      $ctrl.data.month2.cGPAmount.value = calculatecGPAmount($ctrl.data.month2.revenue.value, $ctrl.data.month2.cost.value);
      $ctrl.data.month3.cGPAmount.value = calculatecGPAmount($ctrl.data.month3.revenue.value, $ctrl.data.month3.cost.value);
      $ctrl.data.month1.cGPProcents.value = calculatecGPProcents($ctrl.data.month1.revenue.value, $ctrl.data.month1.cost.value);
      $ctrl.data.month2.cGPProcents.value = calculatecGPProcents($ctrl.data.month2.revenue.value, $ctrl.data.month2.cost.value);
      $ctrl.data.month3.cGPProcents.value = calculatecGPProcents($ctrl.data.month3.revenue.value, $ctrl.data.month3.cost.value);
    }
    quartercGPAmount = calculatecGPAmount(quarterRevenue, quarterCost);
    quartercGPProcents = calculatecGPProcents(quarterRevenue, quarterCost);
    $ctrl.recalculatedValues.quarterRevenue = quarterRevenue;
    $ctrl.recalculatedValues.quarterCost = quarterCost;
    $ctrl.recalculatedValues.quartercGPAmount = quartercGPAmount;
    $ctrl.recalculatedValues.quartercGPProcents = quartercGPProcents;

    function updateCellIfNeeded(item, changedCell) {
      if (changedCell !== undefined) {
        if (item.month1.revenue.column === changedCell.column && item.month1.revenue.row === changedCell.row) {
          item.month1.revenue.value = changedCell.value;
        }
        if (item.month2.revenue.column === changedCell.column && item.month2.revenue.row === changedCell.row) {
          item.month2.revenue.value = changedCell.value;
        }
        if (item.month3.revenue.column === changedCell.column && item.month3.revenue.row === changedCell.row) {
          item.month3.revenue.value = changedCell.value;
        }
        if (item.month1.cost.column === changedCell.column && item.month1.cost.row === changedCell.row) {
          item.month1.cost.value = changedCell.value;
        }
        if (item.month2.cost.column === changedCell.column && item.month2.cost.row === changedCell.row) {
          item.month2.cost.value = changedCell.value;
        }
        if (item.month3.cost.column === changedCell.column && item.month3.cost.row === changedCell.row) {
          item.month3.cost.value = changedCell.value;
        }
      }
    }
  }

  function recalculateTotalsForAccountAdjustments(item) {
    $ctrl.data.month1.cGPAmount.value = calculatecGPAmount(item.month1.revenue.value, item.month1.cost.value);
    $ctrl.data.month2.cGPAmount.value = calculatecGPAmount(item.month2.revenue.value, item.month2.cost.value);
    $ctrl.data.month3.cGPAmount.value = calculatecGPAmount(item.month3.revenue.value, item.month3.cost.value);
    $ctrl.data.month1.cGPProcents.value = calculatecGPProcents(item.month1.revenue.value, item.month1.cost.value);
    $ctrl.data.month2.cGPProcents.value = calculatecGPProcents(item.month2.revenue.value, item.month2.cost.value);
    $ctrl.data.month3.cGPProcents.value = calculatecGPProcents(item.month3.revenue.value, item.month3.cost.value);
    const quarterRevenue = Number(item.month1.revenue.value) + Number(item.month2.revenue.value) + Number(item.month3.revenue.value);
    const quarterCost = Number(item.month1.cost.value) + Number(item.month2.cost.value) + Number(item.month3.cost.value);
    const quartercGPAmount = calculatecGPAmount(quarterRevenue, quarterCost);
    const quartercGPProcents = calculatecGPProcents(quarterRevenue, quarterCost);
    $ctrl.recalculatedValues.quarterRevenue = utilsService.formatNumber(quarterRevenue);
    $ctrl.recalculatedValues.quarterCost = utilsService.formatNumber(quarterCost);
    $ctrl.recalculatedValues.quartercGPAmount = quartercGPAmount;
    $ctrl.recalculatedValues.quartercGPProcents = quartercGPProcents;
  }

  function calculatecGPAmount(revenue, cost) {
    return utilsService.formatNumber(Number(revenue) - Number(cost));
  }

  function calculatecGPProcents(revenue, cost) {
    if (Number(revenue) !== 0) {
      return utilsService.formatProcents((Number(revenue) - Number(cost)) / Number(revenue));
    }
    return 0;
  }

  $scope.today = function () {
    if (input.isAdd) {
      $scope.dt = new Date();
    } else if ($ctrl.data.action.dueDate && $ctrl.data.action.dueDate.value) {
      $scope.dt = new Date($ctrl.data.action.dueDate.value);
    }
  };


  $scope.today();

  $scope.clear = function () {
    $scope.dt = null;
  };

  $scope.inlineOptions = {
    minDate: new Date(),
    showWeeks: true,
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    maxDate: new Date(2020, 5, 22),
    minDate: new Date(),
    startingDay: 1,
  };


  $scope.open1 = function () {
    $scope.popup1.opened = true;
  };


  $scope.displayDateFormat = CognosService.CognosConfigService.prop.DISPLAY_DATE_FORMAT || 'yyyy-MM-dd';
  $scope.format = CognosService.CognosConfigService.prop.DISPLAY_DATE_FORMAT || 'yyyy-MM-dd';

  $scope.popup1 = {
    opened: false,
  };
}
