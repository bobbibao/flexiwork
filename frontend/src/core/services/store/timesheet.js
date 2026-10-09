import ApiService from "@/core/services/api.service";

//action types
export const GET_TIMESHEET = "getTimesheet";
export const GET_WORK_ITEM = "getWorkItem";
export const ADD_WORK_ITEM = "addWorkItem";
export const DELETE_WORK_ITEM = "deleteWorkItem";
export const UPDATE_WORK_LOG = "updateWorkLog";
export const GET_TRACK_PROJECTS = "getTrackProjects";
export const GET_TRACK_SERVICES = "getTrackServices";
export const GET_TRACK_TASKS = "getTrackTasks";
export const LOCK_WORK_RECORD = "lockWorkRecord";
export const UNLOCK_WORK_RECORD = "unlockWorkRecord";
export const GET_SUBMITTED_USERS = "getSubmittedUsers";
export const GET_FLEXIBLE_TIME = "getFlexibleTime";
export const GET_DISPLAY_WORK_ITEMS = "getDisplayWorkitems";
export const UPDATE_DISPLAY_WORK_ITEMS = "updateDisplayWorkItems";
export const SELECT_USER = "selectUser";
export const GET_LOCKED_TIMESHEET = "getLockedTimesheet";

//mutation types
export const SET_TIMESHEET = "setTimesheet";
export const SET_TIMESHEET_ERROR = "setTimesheetError";
export const SET_TRACK_PROJECTS = "setTrackProjects";
export const SET_TRACK_SERVICES = "setTrackServices";
export const SET_TRACK_TASKS = "setTrackTasks";
export const SET_WORK_ITEM = "setWorkItem";
export const SET_SUBMITTED_USERS = "setSubmittedUsers";
export const SET_FLEXIBLE_TIME = "setFlexibleTime";
export const SET_DISPLAY_WORK_ITEMS = "setDisplayWorkItems";
export const SET_DISPLAY_PROJECT = "setDisplayProject";
export const SET_DISPLAY_SERVICE = "setDisplayService";
export const SET_DISPLAY_ALL = "setDisplayAll";
export const SET_SELECTED_USER = "setSelectedUser";
export const SET_LOCKED_TIMESHEET = "setLockedTimesheet";

const state = {
  error: null,
  timesheet: [],
  projects: [],
  services: [],
  tasks: [],
  work_item: {},
  submitted_users: [],
  flexible: [],
  display_work_items: [],
  selected_user: {},
  locked_timesheets: []
};

const getters = {
  currentSheet(state) {
    return state.timesheet;
  },
  currentTrackProjects(state) {
    return state.projects;
  },
  currentTrackServices(state) {
    return state.services;
  },
  currentTrackTasks(state) {
    return state.tasks;
  },
  currentWorkItem(state) {
    return state.work_item;
  },
  currentSubmittedUsers(state) {
    return state.submitted_users;
  },
  currentFlexibleTime(state) {
    return state.flexible;
  },
  currentDisplayWorkItems(state) {
    return state.display_work_items;
  },
  selectedUser(state) {
    return state.selected_user;
  },
  currentLockedTimesheets(state) {
    return state.locked_timesheets;
  }
};

const mutations = {
  [SET_TIMESHEET_ERROR](state, error) {
    state.error = error;
  },
  [SET_TIMESHEET](state, data) {
    state.timesheet = data.payload;
    state.error = null;
  },
  [SET_TRACK_PROJECTS](state, data) {
    state.projects = data.payload;
    state.error = null;
  },
  [SET_TRACK_SERVICES](state, data) {
    state.services = data.payload;
    state.error = null;
  },
  [SET_TRACK_TASKS](state, data) {
    state.tasks = data.payload;
    state.error = null;
  },
  [SET_WORK_ITEM](state, data) {
    state.work_item = data.payload;
    state.error = null;
  },
  [SET_SUBMITTED_USERS](state, data) {
    state.submitted_users = data.payload;
    state.error = null;
  },
  [SET_FLEXIBLE_TIME](state, data) {
    state.flexible = data.payload;
    state.error = null;
  },
  [SET_DISPLAY_WORK_ITEMS](state, data) {
    state.display_work_items = data.payload;
    state.error = null;
  },
  [SET_DISPLAY_SERVICE](state, data) {
    for (const item of state.display_work_items) {
      if (item.id === data) {
        item.is_hide = !item.is_hide;
        break;
      }
    }
  },
  [SET_DISPLAY_PROJECT](state, data) {
    for (const item of state.display_work_items) {
      if (item.project.id === data.id) {
        item.is_hide = data.status;
      }
    }
  },
  [SET_DISPLAY_ALL](state, data) {
    for (const item of state.display_work_items) {
      item.is_hide = data;
    }
  },
  [SET_SELECTED_USER](state, data) {
    state.selected_user = data.payload;
    state.error = null;
  },
  [SET_LOCKED_TIMESHEET](state, data) {
    state.locked_timesheets = data.payload;
    state.error = null;
  }
};

const actions = {
  async [GET_TIMESHEET](context, payload) {
    let path = `timesheet/workitems?start_date=${payload.start_date}&end_date=${payload.end_date}`;
    if (payload.filter) {
      path += `&filter=${payload.filter}`;
    }
    if (payload.user) {
      path += `&user_id=${payload.user}`;
    }
    await ApiService.get(path)
      .then(({ data }) => {
        context.commit(SET_TIMESHEET, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [GET_WORK_ITEM](context, payload) {
    await ApiService.get(`timesheet/workitem/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_WORK_ITEM, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [ADD_WORK_ITEM](context, payload) {
    await ApiService.post("timesheet/workitem", payload).catch(
      ({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      }
    );
  },
  async [DELETE_WORK_ITEM](context, payload) {
    await ApiService.delete(`timesheet/workitem/${payload.id}`).catch(
      ({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      }
    );
  },
  async [GET_TRACK_PROJECTS](context) {
    await ApiService.get("timesheet/projects")
      .then(({ data }) => {
        context.commit(SET_TRACK_PROJECTS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [GET_TRACK_SERVICES](context, payload) {
    await ApiService.get(`timesheet/project/${payload.id}/products`)
      .then(({ data }) => {
        context.commit(SET_TRACK_SERVICES, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [GET_TRACK_TASKS](context, payload) {
    await ApiService.get(`timesheet/product/${payload.id}/tasks`)
      .then(({ data }) => {
        context.commit(SET_TRACK_TASKS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [UPDATE_WORK_LOG](context, payload) {
    return await ApiService.post("timesheet/worklog", payload).catch(
      ({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
        return response.data;
      }
    );
  },
  async [GET_SUBMITTED_USERS](context, payload) {
    await ApiService.get(`timesheet/user-locked-list?date=${payload.date}`)
      .then(({ data }) => {
        context.commit(SET_SUBMITTED_USERS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [LOCK_WORK_RECORD](context, payload) {
    await ApiService.post("timesheet/lock", payload).catch(({ response }) => {
      context.commit(SET_TIMESHEET_ERROR, response.data.message);
    });
  },
  async [UNLOCK_WORK_RECORD](context, payload) {
    await ApiService.post("timesheet/unlock", payload).catch(({ response }) => {
      context.commit(SET_TIMESHEET_ERROR, response.data.message);
    });
  },
  async [GET_FLEXIBLE_TIME](context, payload) {
    await ApiService.get(
      `timesheet/workitems/flexhours?user_id=${payload.user_id}&start_date=${payload.start_date}&end_date=${payload.end_date}`
    )
      .then(({ data }) => {
        context.commit(SET_FLEXIBLE_TIME, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [GET_DISPLAY_WORK_ITEMS](context, payload) {
    await ApiService.get(`timesheet/workitems/list?user_id=${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_DISPLAY_WORK_ITEMS, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [UPDATE_DISPLAY_WORK_ITEMS](context, payload) {
    await ApiService.post("timesheet/workitems/show", {
      ids: payload.ids,
      user_id: payload.user_id
    }).catch(({ response }) => {
      context.commit(SET_TIMESHEET_ERROR, response.data.message);
    });
  },
  async [SELECT_USER](context, payload) {
    await ApiService.get(`user/${payload.id}`)
      .then(({ data }) => {
        context.commit(SET_SELECTED_USER, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  },
  async [GET_LOCKED_TIMESHEET](context, payload) {
    await ApiService.get(
      `timesheet/locks?start=${payload.start}&end=${payload.end}`
    )
      .then(({ data }) => {
        context.commit(SET_LOCKED_TIMESHEET, data);
      })
      .catch(({ response }) => {
        context.commit(SET_TIMESHEET_ERROR, response.data.message);
      });
  }
};

export default {
  state,
  actions,
  mutations,
  getters
};
