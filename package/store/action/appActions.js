import {
  LOGIN_WITH_OTP_API,
  LOGIN_WITH_PASSWORD_API,
  LOGIN_WITH_RESET_PASSWORD_API,
  LOGIN_WITH_URL_API
} from "../../config/api";
import { HTTP, MESSAGE_TYPE } from "../../config/constants";
import { formStore } from "../../layout/PageContainer";
import AppService from "../../service/AppService";
import { getForm } from "../../utils/formUtils";
import {
  CLEAR_SNACK_MESSAGE,
  MESSAGE_SHOWED,
  PUSH_SNACK_MESSAGE,
  REMOVE_SNACK_MESSAGE,
  RESET_LOADING,
  RESET_PROGRESS_BAR,
  SET_LOADING,
  SET_PROGRESS_BAR,
  SET_USER_THEME
} from "../types/appTypes";
import {
  HTTP_NO_CONTENT,
  HTTP_UNHANDLED_ERROR_TYPE,
  HTTP_UNHANDLED_SUCCESS_TYPE
} from "../types/commonTypes";
import {
  FORM_DATA_READ_LOADING,
  FORM_INIT_UPDATE,
  FORM_SUBMIT_ERROR,
  FORM_SUBMIT_LOADING,
  FORM_SUBMIT_SUCCESS
} from "../types/formTypes";
import { SET_PENDING_REQUESTS } from "../types/pendingRequestTypes";

export const apiRequestAction =
  (
    method,
    endpoint,
    authRequired,
    data,
    successType,
    errorType,
    localAction = null,
    includeFile = false,
    file = null,
    formId = null,
    reload = false,
    reduxData = {},
    pushSnack = false,
    loadingType = SET_LOADING,
    resetLoadingType = RESET_LOADING,
    reloadForm
  ) =>
    dispatch => {
      try {
        dispatch({ type: SET_PROGRESS_BAR }); //show progress bar
        dispatch({ type: loadingType });
        formId &&
        method !== HTTP.GET &&
        dispatch({
          payload: { formId },
          type   : FORM_SUBMIT_LOADING,
        });
        formId &&
        method === HTTP.GET &&
        dispatch({
          payload: { formId },
          type   : FORM_DATA_READ_LOADING,
        });
        return AppService.apiRequest(
          method,
          endpoint,
          authRequired,
          data,
          includeFile,
          file,
          dispatch
        )
          .then(async response => {
            let formJson = null;
            let reloadFormJson = null;

            if (formId) {
              formJson = await getForm(formId, authRequired, formStore);
            }
            if (reloadForm) {
              reloadFormJson = await getForm(reloadForm, authRequired, formStore);
            }
            if (!response) throw new Error("Response is undefined");

            if (response?.status === 200 || response?.status === 201) {
              if (method !== HTTP.GET)
                dispatch({
                  payload: { data: { ...reduxData, ...response.data }, formId },
                  type   : FORM_SUBMIT_SUCCESS,
                });
              else if (reload && method === HTTP.GET) {
                if (reloadForm) {
                  dispatch({
                    payload: {
                      data    : { ...reduxData, ...response.data },
                      formId  : reloadForm,
                      formJson: reloadFormJson,
                    },
                    type: FORM_INIT_UPDATE,
                  });
                }
                dispatch({
                  payload: {
                    data  : { ...reduxData, ...response.data },
                    formId: formId,
                    formJson,
                  },
                  type: FORM_INIT_UPDATE,
                });
              }

              /**
               * Handling Local Action Type and Function
               */
              if (typeof localAction === "string") {
                dispatch({
                  payload: { ...reduxData, ...data },
                  type   : localAction,
                });
              }else if(typeof localAction === "function"){
                localAction(response?.data);
              }

              if (typeof successType === "string") {
                dispatch({
                  payload: { ...reduxData, ...response.data },
                  type   : successType,
                });
              } else if (typeof successType === "object") {
                if (Array.isArray(successType)) {
                  for (let i = 0; i < successType.length; i++) {
                    dispatch({
                      payload: { ...reduxData, ...response.data },
                      type   : successType[i],
                    });
                  }
                } else {
                  dispatch({
                    payload: { ...reduxData, ...response.data },
                    type   : successType[response.status],
                  });
                }
              } else {
                throw new Error("Unknown successType of this form");
              }
            } else if (response?.status === 204) {

              /**
               * 204 should update reducer otherwise data does not 
               * change 
               */
              if (typeof successType === "string") {
                dispatch({
                  payload: { ...reduxData, data: null },
                  type   : successType,
                });
              } else if (typeof successType === "object") {
                if (Array.isArray(successType)) {
                  for (let i = 0; i < successType.length; i++) {
                    dispatch({
                      payload: { ...reduxData, data: null },
                      type   : successType[i],
                    });
                  }
                } else {
                  dispatch({
                    payload: { ...reduxData, data: null },
                    type   : successType[response.status],
                  });
                }
              } else {
                throw new Error("Unknown successType of this form");
              }

              //form related
              if (reload && method === HTTP.GET) {
                if (reloadForm) {
                  dispatch({
                    payload: {
                      data    : { ...reduxData, ...response.data },
                      formId  : reloadForm,
                      formJson: reloadFormJson,
                    },
                    type: FORM_INIT_UPDATE,
                  });
                }
                dispatch({
                  payload: {
                    data  : { ...reduxData, ...response.data },
                    formId: formId,
                    formJson,
                  },
                  type: FORM_INIT_UPDATE,
                });
              }
              dispatch({
                payload: { ...reduxData, ...response.data },
                type   : HTTP_NO_CONTENT,
              });
            } else {
              dispatch({
                payload: { ...reduxData, ...response },
                type   : HTTP_UNHANDLED_SUCCESS_TYPE,
              });
            }

            dispatch({ type: resetLoadingType });
            if (pushSnack) {
              dispatch(
                pushSnackMessage(
                  MESSAGE_TYPE.SUCCESS_MESSAGE,
                  response?.data?.message
                )
              );
            }
            return Promise.resolve();
          })
          .catch(error => {
          // eslint-disable-next-line no-console
            console.error("ERROR inaction layer", error);
            //CHECK FOR 401|403 AND SENT REQUEST TO STACK
            if (
              (error.status === 401 || error.status === 403) &&
            endpoint !== LOGIN_WITH_OTP_API &&
            endpoint !== LOGIN_WITH_PASSWORD_API &&
            endpoint !== LOGIN_WITH_URL_API &&
            endpoint !== LOGIN_WITH_RESET_PASSWORD_API
            ) {
              dispatch({
                payload: {
                  authRequired,
                  data,
                  endpoint,
                  errorType,
                  file,
                  formId,
                  includeFile,
                  loadingType,
                  localAction,
                  method,
                  pushSnack,
                  reduxData,
                  reload,
                  resetLoadingType,
                  successType,
                },
                type: SET_PENDING_REQUESTS,
              });
            } else {
              if (formId) {
              // eslint-disable-next-line no-console
                console.log("DISPATH REDUCER FORM ERROR");
                dispatch({
                  payload: { ...reduxData, data: error, formId },
                  type   : FORM_SUBMIT_ERROR,
                });
              }
              if (errorType) {
                if (typeof errorType === "string") {
                  dispatch({
                    payload: { ...reduxData, data: error },
                    type   : errorType,
                  });
                } else if (typeof errorType === "object") {
                  if (Array.isArray(successType)) {
                    for (let i = 0; i < successType.length; i++) {
                      dispatch({
                        payload: { ...reduxData, data: error },
                        type   : errorType[i],
                      });
                    }
                  } else {
                    dispatch({
                      payload: { ...reduxData, data: error },
                      type   : errorType[error.response.status],
                    });
                  }
                }
              } else {
                dispatch({
                  payload: { ...reduxData, data: error },
                  type   : HTTP_UNHANDLED_ERROR_TYPE,
                });
              }
              dispatch({ type: resetLoadingType });
              if (pushSnack) {
                dispatch(
                  pushSnackMessage(
                    MESSAGE_TYPE.ERROR_MESSAGE,
                    error?.response?.data?.message
                  )
                );
              }
            }

          // return Promise.reject();
          })
          .finally(() => {
            dispatch({ type: RESET_PROGRESS_BAR });
          });
      } catch (error) {
      // eslint-disable-next-line no-console
        console.error("Something went wrong.", error);
        dispatch({ type: RESET_PROGRESS_BAR });
      }
    };

/**
 * Snack message related action
 */
export const pushSnackMessage = (type, message, snackProps = {}) => dispatch => {
  // eslint-disable-next-line etc/no-commented-out-code
  // enqueueSnackbar(message, { variant: type });
  dispatch({
    payload: {
      _timestamp: new Date().getTime(),
      message   : message || "Message not provided",
      type      : type,
      ...snackProps
    },
    type: PUSH_SNACK_MESSAGE,
  });
};

export const messageShowed = (timestamp) => ({
  payload: { _timestamp: timestamp },
  type   : MESSAGE_SHOWED,
});

export const removeSnackMessage = (timestamp) => ({
  payload: { _timestamp: timestamp },
  type   : REMOVE_SNACK_MESSAGE,
});

export const clearSnackMessages = () => dispatch => {
  // eslint-disable-next-line etc/no-commented-out-code
  // closeSnackbar();
  dispatch({ type: CLEAR_SNACK_MESSAGE });
};

export const setUserTheme = (themeName) => dispatch => {
  // eslint-disable-next-line etc/no-commented-out-code
  // closeSnackbar();
  dispatch({ payload: themeName, type: SET_USER_THEME });
};
