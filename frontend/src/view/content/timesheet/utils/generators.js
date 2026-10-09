import moment from "moment";
import { sumBy, get, every } from "lodash";
import { generateCellClass, getCellStyle, getTaskCellStyle, getTotalCellStyle } from "./cellStyle";

export const generateColumnDefs = (dates, { $t }) => {
  const def = [
    {
      headerName: $t("timesheet.service"),
      field: "name",
      width: 200,
      suppressMovable: true,
      pinned: "left",
      resizable: true,
      colSpan: params => {
        return params.data.type === "workitem" ? 1 : 2;
      },
      cellStyle: getCellStyle,
      tooltipValueGetter: params => {
        const isHidden = params.data.is_hidden;
        return isHidden ? `(hidden) ${params.value}` : params.value;
      }
    },
    {
      headerName: $t("timesheet.task"),
      field: "task",
      width: 200,
      resizable: true,
      suppressMovable: true,
      pinned: "left",
      cellStyle: getTaskCellStyle,
      tooltipValueGetter: params => {
        const isHidden = params.data.is_hidden;
        return isHidden ? `(hidden) ${params.value}` : params.value;
      }
    }
  ];

  dates.forEach(date => {
    const key = date.date_formatted.replaceAll(".", "_");
    def.push({
      headerName: moment(date.date).format("DD.MM"),
      field: key,
      width: 60,
      resizable: true,
      suppressMovable: true,
      editable: params => {
        return params.data.type === "workitem";
      },
      type: "rightAligned",
      cellStyle: params => getCellStyle(params, date),
      cellRenderer: "ValueCell",
      cellEditor: "ValueCellEditor",
      headerClass: generateCellClass(date) || "cell-header",
      valueGetter: params => {
        if (params.data.type === "sheet") {
          let value = 0;
          params.api.forEachNode(node => {
            if (node.data.type === "workitem" && node.data.project_id === params.data.project_id) {
              value += get(node.data, `${key}.value`, 0);
            }
          });
          return {
            value: value || null
          };
        }
        return params.data[key];
      },
      headerTooltip: date.holiday_name,
      tooltipValueGetter: params => {
        return get(params, "value.comment", null);
      }
    });
  });

  def.push({
    headerName: $t("timesheet.total"),
    width: 60,
    resizable: true,
    suppressMovable: true,
    type: "rightAligned",
    cellStyle: getTotalCellStyle,
    cellRenderer: "TotalCell",
    headerClass: "cell-total",
    valueGetter: params => {
      if (params.data.type === "workitem") {
        let total = 0;
        dates.forEach(date => {
          const key = date.date_formatted.replace(/\./g, "_");
          total += get(params.data, `${key}.value`, 0);
        });
        return {
          value: total || null
        };
      }
      if (params.data.type === "sheet") {
        let total = 0;
        params.api.forEachNode(node => {
          if (node.data.type === "workitem" && node.data.project_id === params.data.project_id) {
            dates.forEach(date => {
              const key = date.date_formatted.replace(/\./g, "_");
              total += get(node.data, `${key}.value`, 0);
            });
          }
        });
        return {
          value: total || null
        };
      }
      if (params.data.id === "diff") {
        let totalWorked = 0;
        let totalMustWork = 0;
        dates.forEach(date => {
          const key = date.date_formatted.replace(/\./g, "_");
          totalWorked += get(params.data, `${key}.value`, 0);
          // Get the "must-work" row value for each date
          params.api.forEachNode(node => {
            if (node.data.id === "must-work") {
              totalMustWork += get(node.data, `${key}.value`, 0);
            }
          });
        });
        return {
          value: totalWorked - totalMustWork
        };
      }
      return {
        value: get(params.data, "value", 0)
      };
    }
  });

  return def;
};

export const generateRowData = (sheet, dates) =>
  sheet
    .sort((a, b) => parseInt(a.name) - parseInt(b.name))
    .reduce((acc, curr) => {
      // work item rows
      const workItemRows = curr.services.map(record => {
        const row = {
          type: "workitem",
          project_id: curr.id,
          service_id: record.id,
          workitem_id: record.workitem_id,
          name: record.name,
          task: record.task,
          user: record.user,
          is_hidden: record.is_hidden
        };

        dates.forEach(date => {
          const workLog = record.work_logs.find(wl => wl.date_formatted === date.date_formatted);
          const key = date.date_formatted.replace(/\./g, "_");
          if (workLog) {
            const value = parseFloat(workLog.spent) || null;
            row[key] = {
              value,
              comment: workLog.comment
            };
          } else {
            row[key] = {
              value: null,
              comment: null
            };
          }
        });

        return row;
      });

      // sheet row
      const sheetRow = {
        type: "sheet",
        project_id: curr.id,
        name: curr.name,
        is_hidden: every(workItemRows, r => r.is_hidden)
      };

      acc.push(sheetRow);
      acc.push(...workItemRows);

      return acc;
    }, []);

export const generateFlexData = (dates, { flexibleTime = [], $t }) => {
  const flexible = {
    type: "summary",
    id: "flexible",
    name: $t("timesheet.flexible")
  };

  const pFlexibleTime = flexibleTime.reduce((acc, curr) => {
    acc[moment(curr.date).format("DD_MM_YYYY")] = curr.flex_hours;
    return acc;
  }, {});

  dates.forEach(date => {
    const key = date.date_formatted.replace(/\./g, "_");

    // flexible
    flexible[key] = {
      value: pFlexibleTime[key] || 0
    };
  });

  return flexible;
};

export const generateFooterData = (rowData, dates, { flexibleTime = [], user, $t }) => {
  const mustWork = {
    type: "summary",
    id: "must-work",
    name: $t("timesheet.mustWork")
  };
  const dailyTotal = {
    type: "summary",
    id: "daily-total",
    name: $t("timesheet.dailyTotal")
  };
  const diff = {
    type: "summary",
    id: "diff",
    name: $t("timesheet.diff")
  };

  const pMustWork = flexibleTime.reduce((acc, curr) => {
    acc[moment(curr.date).format("DD_MM_YYYY")] = curr.actual_hours;
    return acc;
  }, {});

  dates.forEach(date => {
    const key = date.date_formatted.replace(/\./g, "_");

    // must work
    const mw =
      date.is_weekend || date.is_holiday // check must work for holiday after current date, out of flexible time range from server
        ? 0
        : get(pMustWork, key, parseFloat(user.max_work_hours_per_day));
    mustWork[key] = {
      value: mw
    };

    // total
    const workitemRows = rowData.filter(row => row.type === "workitem");
    const total = sumBy(workitemRows, r => get(r, `${key}.value`, 0));
    dailyTotal[key] = {
      value: total
    };

    // different
    diff[key] = {
      value: total - mw
    };
  });

  return [mustWork, dailyTotal, diff];
};
