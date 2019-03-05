module.exports = AccountEditCognosService;

const angular = require('angular');

AccountEditCognosService.$inject = ['$log', '$q', 'CognosService', 'CognosDimentionService',
  'CognosResponseService', 'asyncService', 'ErrorService', 'utilsService', '$http', 'UserSettingsService'];
function AccountEditCognosService($log, $q, CognosService, CognosDimentionService,
  CognosResponseService, asyncService, ErrorService, utilsService, $http, UserSettingsService) {
  const dimentions = CognosDimentionService.dimentions.RR_INPUT;
  const columnNames = CognosDimentionService.columns.RR_INPUT;
  const riskCategories = CognosDimentionService.riskCategories.RR_INPUT;

  const measures = [
    columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3, columnNames.revenue_Qtr,
    columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3, columnNames.cost_Qtr,
    columnNames.cGPAmount_M1, columnNames.cGPAmount_M2, columnNames.cGPAmount_M3,
    columnNames.cGPAmount_Qtr,
    columnNames.cGPProcents_M1, columnNames.cGPProcents_M2, columnNames.cGPProcents_M3,
    columnNames.cGPProcents_Qtr,
    columnNames.cGPPlan, columnNames.actionComment,columnNames.actionTask, columnNames.actionOwner,
    columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment,
  ];

  this.getRoadmapDetailsCommitData = getRoadmapDetailsCommitData;
  this.getRoadmapDetailsBestCanDoData = getRoadmapDetailsBestCanDoData;
  this.updateCell = updateCell;
  this.updateCells = updateCellsInSeries;
  this.getEmptyObject = getEmptyObject;
  this.getItemForEdit = getItemForEdit;
  this.updateItem = updateItem;
  this.getNextItemIndex = getNextItemIndex;

  function getRoadmapDetailsCommitData(filter, callback) {
    const measuresToBeRetrieved = angular.copy(measures);
    if (UserSettingsService.isEuGtsRegion()) {
      measuresToBeRetrieved.push(columnNames.review);
    }
    const columnsStatment = prepareColumnsStatment(measuresToBeRetrieved, dimentions.measures);
    const query = `${'SELECT ' +
      '{'}${columnsStatment}} ON COLUMNS, ` +
      'NON EMPTY {' +
      `DESCENDANTS([${dimentions.riskCategories}].[${riskCategories.solid}]),` +
      `DESCENDANTS([${dimentions.riskCategories}].[${riskCategories.risk}]),` +
      `[${dimentions.riskCategories}].[${riskCategories.commit}]` +
      '} ON ROWS ' +
      `FROM [${CognosService.getMainCubeName()}] ` +
      'WHERE (' +
      `[${dimentions.versions}].[${filter.version}],` +
      `[${dimentions.timeYears}].[${filter.year}],` +
      `[${dimentions.timeQuarters}].[${filter.quarter}],` +
      `[${dimentions.timeWeeks}].[${filter.week}],` +
      `[${dimentions.serviceLines}].[${filter.serviceLine}],` +
      `[${dimentions.approvals}].[${filter.node}],` +
      `[${dimentions.accounts}].[${filter.account}]` +
      `${CognosService.addRoadmapItemTypeConditionIfRequiredString(filter.roadmapItemType)}` +
      ')';
    CognosService.executeNativeQuery(query, filter.sandbox, (err, response) => {
      if (err) {
        return callback(err);
      }
      const commitData = transformCommitData(response.processedData.data);
      callback(err, commitData);
    });
  }

  function getRoadmapDetailsBestCanDoData(filter, callback) {
    const measuresToBeRetrieved = angular.copy(measures);
    if (UserSettingsService.isEuGtsRegion()) {
      measuresToBeRetrieved.push(columnNames.review);
    }
    const columnsStatment = prepareColumnsStatment(measuresToBeRetrieved, dimentions.measures);
    const query = `${'SELECT ' +
      '{'}${columnsStatment}} ON COLUMNS, ` +
      'NON EMPTY {' +
      `DESCENDANTS([${dimentions.riskCategories}].[Stretch]),` +
      `[${dimentions.riskCategories}].[Best Can Do]` +
      '} ON ROWS ' +
      `FROM [${CognosService.getMainCubeName()}] ` +
      'WHERE (' +
      `[${dimentions.versions}].[${filter.version}],` +
      `[${dimentions.timeYears}].[${filter.year}],` +
      `[${dimentions.timeQuarters}].[${filter.quarter}],` +
      `[${dimentions.timeWeeks}].[${filter.week}],` +
      `[${dimentions.serviceLines}].[${filter.serviceLine}],` +
      `[${dimentions.approvals}].[${filter.node}],` +
      `[${dimentions.accounts}].[${filter.account}]` +
      `${CognosService.addRoadmapItemTypeConditionIfRequiredString(filter.roadmapItemType)}` +
      ')';
    CognosService.executeNativeQuery(query, filter.sandbox, (err, response) => {
      if (err) {
        return callback(err);
      }
      const bestCanDoData = transformBestCanDoData(response.processedData.data);
      callback(err, bestCanDoData);
    });
  }

  function transformCommitData(data) {
    const result = {};
    result.solid = transformRows(data, 'Solid');
    result.risk = transformRows(data, 'Risk');
    result.commit = transformRow('Commit', data, true);
    return result;
  }

  function transformBestCanDoData(data) {
    const result = {};
    result.stretch = transformRows(data, 'Stretch');
    result.bestCanDo = transformRow('Best Can Do', data, true);
    return result;
  }

  function transformRows(data, riskCategory) {
    const result = transformRow(riskCategory, data, true);
    const items = [];
    data.forEach((e) => {
      if (e.revenueRiskCategory.Name.indexOf(`${riskCategory} -`) !== -1) {
        items.push(getObjectFromRow(e, e.revenueRiskCategory.Name, columnNames));
      }
    });
    result.items = items;
    return result;
  }

  function getObjectFromRow(row, rowName, columnNames) {
    return {
      name: row.revenueRiskCategory.Name,
      quarter: {
        revenue: getAttributesRounded(row, columnNames.revenue_Qtr, rowName),
        cost: getAttributesRounded(row, columnNames.cost_Qtr, rowName),
        cGPAmount: getAttributesRounded(row, columnNames.cGPAmount_Qtr, rowName),
        cGPProcents: getAttributesProcents(row, columnNames.cGPProcents_Qtr, rowName),
      },
      month1: {
        revenue: getAttributesRounded(row, columnNames.revenue_M1, rowName),
        cost: getAttributesRounded(row, columnNames.cost_M1, rowName),
        cGPAmount: getAttributesRounded(row, columnNames.cGPAmount_M1, rowName),
        cGPProcents: getAttributesProcents(row, columnNames.cGPProcents_M1, rowName),
      },
      month2: {
        revenue: getAttributesRounded(row, columnNames.revenue_M2, rowName),
        cost: getAttributesRounded(row, columnNames.cost_M2, rowName),
        cGPAmount: getAttributesRounded(row, columnNames.cGPAmount_M2, rowName),
        cGPProcents: getAttributesProcents(row, columnNames.cGPProcents_M2, rowName),
      },
      month3: {
        revenue: getAttributesRounded(row, columnNames.revenue_M3, rowName),
        cost: getAttributesRounded(row, columnNames.cost_M3, rowName),
        cGPAmount: getAttributesRounded(row, columnNames.cGPAmount_M3, rowName),
        cGPProcents: getAttributesProcents(row, columnNames.cGPProcents_M3, rowName),
      },
      cGPPlan: getAttributes(row, columnNames.cGPPlan, rowName),
      action: {
        comment: getAttributes(row, columnNames.actionComment, rowName),
        taskid: getAttributes(row,columnNames,actionTask, rowName),
        owner: getAttributes(row, columnNames.actionOwner, rowName),
        dueDate: getAttributes(row, columnNames.actionDueDate, rowName),
        RAG: getAttributes(row, columnNames.rag_load, rowName),
        richComment: getAttributes(row, columnNames.actionRichComment, rowName),
        review: getAttributes(row, columnNames.review, rowName),
      },
    };
  }

  function transformRow(rowName, data, fillWithZerosFlag) {
    let result;
    const row = findRowByName(rowName, data);
    if (row !== undefined) {
      result = getObjectFromRow(row, rowName, columnNames);
    } else if (fillWithZerosFlag) {
      result = getEmptyObject(rowName, columnNames);
    }
    return result;
  }

  function getAttributes(data, column, row) {
    return {
      value: data[column],
      updatable: data[column + columnNames.updatable],
      sandbox: data[column + columnNames.sandbox],
      column,
      row,
    };
  }

  function getAttributesRounded(data, column, row) {
    return getAttributesCommon(data, column, row, false);
  }

  function getAttributesProcents(data, column, row) {
    return getAttributesCommon(data, column, row, true);
  }

  function getAttributesCommon(data, column, row, isProcents) {
    let value;
    if (isProcents) {
      value = utilsService.formatProcents(data[column]);
    } else {
      value = utilsService.formatNumber(data[column]);
    }

    return {
      value,
      originalValue: data[column],
      updatable: data[column + columnNames.updatable],
      sandbox: data[column + columnNames.sandbox],
      column,
      row,
    };
  }

  function getEmptyObject(rowName, columnNames) {
    const result = {
      name: rowName,
      quarter: {
        revenue: getAttributes(0, columnNames.revenue_Qtr, rowName),
        cost: getAttributes(0, columnNames.cost_Qtr, rowName),
        cGPAmount: getAttributes(0, columnNames.cGPAmount_Qtr, rowName),
        cGPProcents: getAttributes(0, columnNames.cGPProcents_Qtr, rowName),
      },
      month1: {
        revenue: getAttributes(0, columnNames.revenue_M1, rowName),
        cost: getAttributes(0, columnNames.cost_M1, rowName),
        cGPAmount: getAttributes(0, columnNames.cGPAmount_M1, rowName),
        cGPProcents: getAttributes(0, columnNames.cGPProcents_M1, rowName),
      },
      month2: {
        revenue: getAttributes(0, columnNames.revenue_M2, rowName),
        cost: getAttributes(0, columnNames.cost_M2, rowName),
        cGPAmount: getAttributes(0, columnNames.cGPAmount_M2, rowName),
        cGPProcents: getAttributes(0, columnNames.cGPProcents_M2, rowName),
      },
      month3: {
        revenue: getAttributes(0, columnNames.revenue_M3, rowName),
        cost: getAttributes(0, columnNames.cost_M3, rowName),
        cGPAmount: getAttributes(0, columnNames.cGPAmount_M3, rowName),
        cGPProcents: getAttributes(0, columnNames.cGPProcents_M3, rowName),
      },
      cGPPlan: getAttributes(0, columnNames.cGPPlan, rowName),
      action: {
        comment: getAttributes('', columnNames.actionComment, rowName),
        taskid: getAttributes('',columnNames.actionTask,rowName),
        owner: getAttributes('', columnNames.actionOwner, rowName),
        dueDate: getAttributes('', columnNames.actionDueDate, rowName),
        RAG: getAttributes('', columnNames.rag_load, rowName),
        richComment: getAttributes('', columnNames.actionRichComment, rowName),
        review: getAttributes('', columnNames.review, rowName),
      },
    };

    return result;

    function getAttributes(value, column, row) {
      return {
        empty: true,
        value,
        column,
        row,
      };
    }
  }

  function findRowByName(rowName, data, exactMatch) {
    let result;
    data.forEach((e) => {
      if (e.revenueRiskCategory.Name === rowName) {
        result = e;
      }
    });
    return result;
  }

  function prepareColumnsStatment(measures, dimension) {
    let columnsStatment = '';
    measures.forEach((e, index) => {
      columnsStatment += `[${dimension}].[${e}]`;
      if (index != measures.length - 1) {
        columnsStatment += ',';
      }
    });
    return columnsStatment;
  }

  function updateCell(cell, filter, callback) {
    if (cell.updatable === true || cell.empty === true) {
      getCellForEdit(cell.column, cell.row, filter, (err, cellForEdit) => {
        $log.info('cellForEdit', cellForEdit);
        if (cell.value !== cellForEdit.currentValue) {
          CognosService.updateCell(cell.value, cellForEdit.ordinal, cellForEdit.queryId, filter.sandbox, filter.isMgmt, (response) => {
            $log.info('updateCell SUCCESS', response);
            callback(null, response);
          }, (error) => {
            $log.info('updateCell ERROR', error);
            callback(error);
          });
        } else {
          $log.info('Value of cell was not changed. Update is not needed!!!', cell);
          callback(null, -2);
        }
      });
    } else {
      $log.info('Cell is not updatable!!!', cell);
      callback(null, -1);
    }
  }

  function updateCell2(cell, filter) {
    return $q((resolve, reject) => {
      if (cell.updatable === true || cell.empty === true || filter.isMgmt === true) {
        getCellForEdit(cell.column, cell.row, filter, (err, cellForEdit) => {
          $log.info('cellForEdit', cellForEdit);
          $log.info('filter.isMgmt', filter.isMgmt);
          if (angular.isDefined(cellForEdit) && cell.value !== cellForEdit.currentValue) {
            CognosService.updateCell(cell.value, cellForEdit.ordinal, cellForEdit.queryId, filter.sandbox, filter.isMgmt, (response) => {
              $log.info('updateCell SUCCESS', response);
              resolve(response);
            }, (error) => {
              $log.info('updateCell ERROR', error);
              reject(error);
            });
          } else {
            $log.info('Value of cell was not changed. Update is not needed!!!', cell);
            resolve(-2);
          }
        });
      } else {
        $log.info('Cell is not updatable!!!(2)', cell);
        resolve(-1);
      }
    });
  }

  function updateCellsInSeries(cells, filter, callback) { // Temporal solution
    if (filter.isMgmt || filter.sandbox) {
      if (cells.length > 0) {
        updateCell2(cells[0], filter).then((data) => {
          $log.info('Cell update 0 response ', cells[0], data);
          if (cells.length > 1) {
            updateCell2(cells[1], filter).then((data) => {
              $log.info('Cell update 1 response ', cells[1], data);
              if (cells.length > 2) {
                updateCell2(cells[2], filter).then((data) => {
                  $log.info('Cell update 2 response ', cells[2], data);
                  if (cells.length > 3) {
                    updateCell2(cells[3], filter).then((data) => {
                      $log.info('Cell update 3 response ', cells[3], data);
                      if (cells.length > 4) {
                        updateCell2(cells[4], filter).then((data) => {
                          $log.info('Cell update 4 response ', cells[4], data);
                          if (cells.length > 5) {
                            updateCell2(cells[5], filter).then((data) => {
                              $log.info('Cell update 5 response ', cells[5], data);
                              if (cells.length > 6) {
                                updateCell2(cells[6], filter).then((data) => {
                                  $log.info('Cell update 6 response ', cells[6], data);
                                  if (cells.length > 7) {
                                    updateCell2(cells[7], filter).then((data) => {
                                      $log.info('Cell update 7 response ', cells[7], data);
                                      if (cells.length > 8) {
                                        updateCell2(cells[8], filter).then((data) => {
                                          $log.info('Cell update 8 response ', cells[8], data);
                                          if (cells.length > 9) {
                                            updateCell2(cells[9], filter).then((data) => {
                                              $log.info('Cell update 9 response ', cells[9], data);
                                              if (cells.length > 10) {
                                                updateCell2(cells[10], filter).then((data) => {
                                                  $log.info('Cell update 10 response ', cells[10], data);
                                                }, callback);
                                              } if (cells.length > 11) {
                                                updateCell2(cells[11], filter).then((data) => {
                                                  $log.info('Cell update 11 response ', cells[11], data);
                                                  callback();
                                                }, callback);
                                              } else {
                                                callback();
                                              }
                                            }, callback);
                                          } else {
                                            callback();
                                          }
                                        }, callback);
                                      } else {
                                        callback();
                                      }
                                    }, callback);
                                  } else {
                                    callback();
                                  }
                                }, callback);
                              } else {
                                callback();
                              }
                            }, callback);
                          } else {
                            callback();
                          }
                        }, callback);
                      } else {
                        callback();
                      }
                    }, callback);
                  } else {
                    callback();
                  }
                }, callback);
              } else {
                callback();
              }
            }, callback);
          } else {
            callback();
          }
        }, callback);
      } else {
        callback();
      }
    } else {
      callback(ErrorService.createBusinessError('You are trying to update without locking of node.', null, 'AccountEditCognosService'));
    }
  }
  /**
   * Update values in a edit item. (Optimization)
   */
  function updateItem(_config, filter) {
    const deferred = $q.defer();
    const config = {
      queryId: filter.queryID,
      sandbox: filter.sandbox,
      data: [],
      isMgmt: filter.isMgmt,
    };
    Object.keys(_config.data).forEach((item) => {
      config.data[_config.data[item].ordinal] = { Ordinal: _config.data[item].ordinal, Value: _config.data[item].value };
      if (angular.isDefined(_config.data[item].ReferenceCell)) {
        config.data[_config.data[item].ordinal].ReferenceCell = _config.data[item].ReferenceCell;
      }
    });
    CognosService.updateCells(config).then((data) => {
      deferred.resolve(data);
    }, (er) => {
      deferred.reject(er);
    });
    return deferred.promise;
  }

  const itemColumns = [
    columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3,
    columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3,
    // columnNames.cGPPlan, //removing cGPPlan because it is blocking Add Solid/Risk/Stretch for non-admin users
    columnNames.actionComment,columnNames.actionTask, columnNames.actionOwner, columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment, columnNames.underscore,
  ];

  const itemColumnsEuGts = [
    columnNames.revenue_M1, columnNames.revenue_M2, columnNames.revenue_M3,
    columnNames.cost_M1, columnNames.cost_M2, columnNames.cost_M3,
    // columnNames.cGPPlan, //removing cGPPlan because it is blocking Add Solid/Risk/Stretch for non-admin users
    columnNames.actionComment, columnNames.actionTask,columnNames.actionOwner, columnNames.actionDueDate, columnNames.rag_load, columnNames.actionRichComment,
    columnNames.review, columnNames.underscore
  ];

  /**
   * Gets Item (e.g. Solid-1) from backend. So we could edit it later. (Optimization)
   */
  function getItemForEdit(filter, columnsArray) {
    const deferred = $q.defer();
    let columns = itemColumns;
    if (angular.isDefined(columnsArray)) {
      columns = columnsArray;
    } else if (UserSettingsService.isEuGtsRegion()) {
      columns = itemColumnsEuGts;
    }
    const query = {
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: CognosDimentionService.prepareColumnsStatment(columns, dimentions.measures),
      ROWS: `[${dimentions.riskCategories}].[${filter.riskCategory}]`,
      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
      `[${dimentions.timeYears}].[${filter.year}]`,
      `[${dimentions.timeQuarters}].[${filter.quarter}]`,
      `[${dimentions.timeWeeks}].[${filter.week}]`,
      `[${dimentions.serviceLines}].[${filter.serviceLine}]`,
      `[${dimentions.approvals}].[${filter.node}]`,
      `[${dimentions.accounts}].[${filter.account}]`,
      ],
      sandbox: filter.sandbox,
      successCallback(response) {
        const options = {
          cellHierarchies: true,
          ordinal: true,
        };
        const processedData = CognosResponseService.processJSON(response, options);
        deferred.resolve(processedData);
      },
      errorCallback(error) {
        $log.info('Error', error);
        deferred.reject(error);
      },
      keepQueryID: true,
    };
    query.isTarget = filter.isTarget;
    query.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(query.WHERE, filter.roadmapItemType);
    CognosService.mdxQuery(query);
    return deferred.promise;
  }

  function getCellForEdit(column, row, filter, callback) {
    const query = {
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `[${dimentions.measures}].[${column}]`,
      ROWS: `[${dimentions.riskCategories}].[${row}]`,
      WHERE: [`[${dimentions.versions}].[${filter.version}]`,
      `[${dimentions.timeYears}].[${filter.year}]`,
      `[${dimentions.timeQuarters}].[${filter.quarter}]`,
      `[${dimentions.timeWeeks}].[${filter.week}]`,
      `[${dimentions.serviceLines}].[${filter.serviceLine}]`,
      `[${dimentions.approvals}].[${filter.node}]`,
      `[${dimentions.accounts}].[${filter.account}]`,
      ],
      keepQueryID: true,
    };


    query.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(query.WHERE, 
        angular.isDefined(filter.roadmapItemType) ? filter.roadmapItemType : angular.isDefined(filter.account) && filter.account.indexOf('Sign Yield') != -1 ? 'Other' : 'Backlog');
    CognosService.executeQuery(query, filter.sandbox, (err, response) => {
      if (err) return callback(err);
      const cell = {
        queryId: response.nativeData.data.ID,
        ordinal: 0,
        currentValue: response.nativeData.data.Cells[0].Value,
        consolidated: response.nativeData.data.Cells[0].Consolidated,
        updatable: response.nativeData.data.Cells[0].Updateable,
      };
      callback(null, cell);
    });
  }

  function addNewElement(processData, sandbox) {
    return $q((resolve, reject) => {
      const headers = {};
      if (sandbox) {
        headers['TM1-Sandbox'] = sandbox;
      }
      const request = {
        method: 'POST',
        url: `${CognosService.CognosConfigService.prop.baseUrl}/Processes('Update.Dim.RevenueRiskCategory.AddNewElement')/tm1.Execute`,
        headers,
        data: {
          Parameters: [{
            Name: 'psYear',
            Value: `${processData.year}`,
          },
          {
            Name: 'psQuarter',
            Value: processData.quarter,
          },
          {
            Name: 'psServiceLine',
            Value: processData.serviceLine,
          },
          {
            Name: 'psApproval',
            Value: processData.approval,
          },
          {
            Name: 'psAccount',
            Value: processData.account,
          },
          {
            Name: 'psRRCatCons',
            Value: processData.riskCategory,
          },
          ],
        },
        withCredentials: true,
        cache: false,
      };
      $http(request).then((response) => {
        resolve(response);
      }, (err) => {
        reject(ErrorService.createCognosError(err));
      });
      // resolve();
    });
  }

  function getNextItemIndexQuery(row, filter, callback) {
    const query = {
      FROM: `[${CognosService.getMainCubeName()}]`,
      COLUMNS: `[${dimentions.measures}].[${columnNames.underscore}]`,
      ROWS: `{head({filter({TM1FILTERBYLEVEL( {TM1DRILLDOWNMEMBER( {[${dimentions.riskCategories}].[${row}]}, ALL , RECURSIVE )},0)}` +
        `,([${CognosService.getMainCubeName()}].([${dimentions.measures}].[${columnNames.underscore_one}])<1))}, 1)}`,
      WHERE: [
        `[${dimentions.versions}].[${filter.version}]`,
        `[${dimentions.timeYears}].[${filter.year}]`,
        `[${dimentions.timeQuarters}].[${filter.quarter}]`,
        `[${dimentions.timeWeeks}].[${filter.week}]`,
        `[${dimentions.serviceLines}].[${filter.serviceLine}]`,
        `[${dimentions.approvals}].[${filter.node}]`,
        `[${dimentions.accounts}].[${filter.account}]`,
      ],
    };
    query.WHERE = CognosService.addRoadmapItemTypeConditionIfRequired(query.WHERE);
    CognosService.executeQuery(query, filter.sandbox, (err, response) => {
      if (err) return callback(err);
      let value;
      if (angular.isDefined(response.processedData.data[0])
        && angular.isDefined(response.processedData.data[0].revenueRiskCategory)
        && angular.isDefined(response.processedData.data[0].revenueRiskCategory.Name)) {
        value = response.processedData.data[0].revenueRiskCategory.Name;
      }
      callback(value);
    });
  }

  function getNextItemIndex(riskCategoryName, filter, callback) {
    getNextItemIndexQuery(riskCategoryName, filter, (pRiskCategory) => {
      if (angular.isDefined(pRiskCategory) && pRiskCategory !== null) {
        callback(null, pRiskCategory);
      } else {
        const processData = {
          approval: filter.node,
          year: filter.year,
          quarter: filter.quarter,
          serviceLine: filter.serviceLine,
          account: filter.account,
          riskCategory: riskCategoryName,
        };
        addNewElement(processData, filter.sandbox).then(() =>
          getNextItemIndexQuery(riskCategoryName, filter, (riskCategory) => {
            callback(null, riskCategory);
          },
          ));
      }
    });
  }
}
