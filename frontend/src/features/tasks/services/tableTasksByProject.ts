import { Project, Task, TaskState, User } from "@/common/models";

export function sortByTextField(
  currentOrder: string,
  field: string,
  data: Project
): {
  currentOrder: string;
  data: Project;
} {
  if (!["name", "description", "input_data", "output_data"].includes(field)) {
    return { currentOrder, data };
  }
  let [currentOrderField, currentFieldDirection] = currentOrder.split(":");
  if (currentOrderField === field) {
    currentFieldDirection = currentFieldDirection === "asc" ? "desc" : "asc";
  } else {
    currentFieldDirection = "asc";
  }

  // Sort logic
  function sortTasks(firstTask: Task, secondTask: Task) {
    if (currentFieldDirection === "asc") {
      // @ts-ignore
      return firstTask[field].localeCompare(secondTask[field], "en", { sensitivity: "base" });
    } else {
      // @ts-ignore
      return secondTask[field].localeCompare(firstTask[field], "en", { sensitivity: "base" });
    }
  }

  // Handle to sort tasks
  data = {
    ...data,
    products: data.products.map(prod => {
      return {
        ...prod,
        tasks: prod.tasks.map(task => {
          // Sort sub tasks
          return {
            ...task,
            sub_tasks: (task.sub_tasks ?? []).sort((a, b) => {
              return sortTasks(a, b);
            })
          }
        }).toSorted((a, b) => {
          // Sort tasks
          return sortTasks(a, b);
        })
      };
    })
  };
  currentOrder = `${field}:${currentFieldDirection}`;

  return { currentOrder, data };
}

export function sortByDateField(
  currentOrder: string,
  field: string,
  data: Project
): {
  currentOrder: string;
  data: Project;
} {
  if (!["created_at", "due_date"].includes(field)) {
    return { currentOrder, data };
  }

  let [currentOrderField, currentFieldDirection] = currentOrder.split(":");
  if (currentOrderField === field) {
    currentFieldDirection = currentFieldDirection === "asc" ? "desc" : "asc";
  } else {
    currentFieldDirection = "asc";
  }

  // Sort logic
  function sortTasks(firstTask: Task, secondTask: Task) {
    if (currentFieldDirection === "asc") {
      // @ts-ignore
      return new Date(firstTask[field]).getTime() - new Date(secondTask[field]).getTime();
    } else {
      // @ts-ignore
      return new Date(secondTask[field]).getTime() - new Date(firstTask[field]).getTime();
    }
  }

  // Handle to sort tasks
  data = {
    ...data,
    products: data.products.map(prod => {
      return {
        ...prod,
        tasks: prod.tasks.map(task => {
          // Sort sub tasks
          return {
            ...task,
            sub_tasks: (task.sub_tasks ?? []).sort((a, b) => {
              return sortTasks(a, b);
            })
          }
        }).toSorted((a, b) => {
          // Sort tasks
          return sortTasks(a, b);
        })
      };
    })
  };
  currentOrder = `${field}:${currentFieldDirection}`;

  return { currentOrder, data };
}

export function sortByCreatedByField(
  currentOrder: string,
  data: Project
): {
  currentOrder: string;
  data: Project;
} {
  let [currentOrderField, currentFieldDirection] = currentOrder.split(":");
  if (currentOrderField === "created_by") {
    currentFieldDirection = currentFieldDirection === "asc" ? "desc" : "asc";
  } else {
    currentFieldDirection = "asc";
  }

  // Sort logic
  function sortTasks(firstTask: Task, secondTask: Task) {
    if (currentFieldDirection === "asc") {
      // @ts-ignore
      return firstTask.creator.name.localeCompare(secondTask.creator.name, "en", { sensitivity: "base" });
    } else {
      // @ts-ignore
      return secondTask.creator.name.localeCompare(firstTask.creator.name, "en", { sensitivity: "base" });
    }
  }

  // Handle to sort tasks
  data = {
    ...data,
    products: data.products.map(product => {
      return {
        ...product,
        tasks: product.tasks.map(task => {
          // Sort sub tasks
          return {
            ...task,
            sub_tasks: (task.sub_tasks ?? []).sort((a, b) => {
              return sortTasks(a, b);
            })
          }
        }).toSorted((a, b) => {
          // Sort tasks
          return sortTasks(a, b);
        })
      };
    })
  };
  currentOrder = `created_by:${currentFieldDirection}`;

  return { currentOrder, data };
}

export function sortByNumberField(
  currentOrder: string,
  field: string,
  data: Project
): {
  currentOrder: string;
  data: Project;
} {
  if (!["status_id", "priority_id"].includes(field)) {
    return { currentOrder, data };
  }

  let [currentOrderField, currentFieldDirection] = currentOrder.split(":");
  if (currentOrderField === field) {
    currentFieldDirection = currentFieldDirection === "asc" ? "desc" : "asc";
  } else {
    currentFieldDirection = "asc";
  }

  // Sort logic
  function sortTasks(firstTask: Task, secondTask: Task) {
    if (currentFieldDirection === "asc") {
      // @ts-ignore
      return firstTask[field] - secondTask[field];
    } else {
      // @ts-ignore
      return secondTask[field] - firstTask[field];
    }
  }

  // Handle to sort tasks
  data = {
    ...data,
    products: data.products.map(product => {
      return {
        ...product,
        tasks: product.tasks.map(task => {
          // Sort sub tasks
          return {
            ...task,
            sub_tasks: (task.sub_tasks ?? []).sort((a, b) => {
              return sortTasks(a, b);
            })
          }
        }).toSorted((a, b) => {
          // Sort tasks
          return sortTasks(a, b);
        })
      };
    })
  };
  currentOrder = `${field}:${currentFieldDirection}`;

  return { currentOrder, data };
}

export function getAssigneeName(assignee: User) {
  const firstName = assignee.first_name ?? "";
  const lastName = assignee.last_name ?? "";

  if (!firstName && !lastName) {
    return "";
  }

  return `${firstName} ${lastName}`;
}

export function getTaskState(states: TaskState[], stateId: number) {
  return states.find(state => state.id === stateId);
}
