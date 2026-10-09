import { get } from "lodash";

export const getCellStyle = (params, { is_holiday, is_today, is_weekend } = {}) => {
  const baseStyle = {
    fontStyle: params.data.is_hidden ? "italic" : null
  };

  if (params.data.type === "summary") {
    const style = {
      ...baseStyle,
      backgroundColor: "#b8daff",
      fontWeight: "bold"
    };

    if (params.data.id === "diff" && params.column.colId !== "name") {
      const value = get(params, "value.value", 0);

      if (value > 0) {
        style.color = "#1BC5BD";
      } else if (value < 0) {
        style.color = "#F64E60";
      }
    }

    if (params.data.id === "flexible") {
      const value = get(params, "value.value", 0);
      if (value > 0) {
        style.backgroundColor = "#c3e6cb";
        style.color = "#1BC5BD";
      } else if (value < 0) {
        style.backgroundColor = "#f5c6cb";
        style.color = "#F64E60";
      }
    }

    return style;
  }
  if (params.data.type === "sheet") {
    return {
      ...baseStyle,
      backgroundColor: "#f3f6f9",
      color: params.column.colId !== "name" ? "#8d8d8d" : null,
      fontWeight: params.column.colId === "name" ? "bold" : "normal",
      cursor: "pointer"
    };
  }

  if (is_today) {
    return {
      ...baseStyle,
      backgroundColor: "#e9e9e9"
    };
  }
  if (is_holiday) {
    return {
      ...baseStyle,
      backgroundColor: "#c3e6cb"
    };
  }
  if (is_weekend) {
    return {
      ...baseStyle,
      backgroundColor: "#c6c6c9"
    };
  }
  return baseStyle;
};

export const getTaskCellStyle = params => {
  return {
    fontStyle: params.data.is_hidden ? "italic" : null,
    cursor: "pointer",
    textDecoration: "underline"
  };
};

export const getTotalCellStyle = params => {
  const baseStyle = {
    fontStyle: params.data.is_hidden ? "italic" : null
  };

  if (params.data.type === "sheet") {
    return {
      ...baseStyle,
      backgroundColor: "#f3f6f9",
      color: "#8d8d8d",
      cursor: "pointer"
    };
  }
  const style = {
    ...baseStyle,
    backgroundColor: "#b8daff",
    fontWeight: "bold"
  };

  if (get(params, "data.id") === "diff") {
    const value = get(params, "value.value", 0);
    if (value > 0) {
      style.color = "#1BC5BD";
    } else if (value < 0) {
      style.color = "#F64E60";
    }
  }

  return style;
};

export const generateCellClass = ({ is_holiday, is_today, is_weekend }) => {
  if (is_today) {
    return "cell-today";
  }
  if (is_holiday) {
    return "cell-holiday";
  }
  if (is_weekend) {
    return "cell-weekend";
  }
  return null;
};
