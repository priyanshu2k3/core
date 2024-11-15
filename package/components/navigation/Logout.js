// eslint-disable-next-line unused-imports/no-unused-imports, no-unused-vars
import React from "react";

// eslint-disable-next-line import/no-unresolved
import { NativeDomNavigate, nativeUseLocation } from "@wrappid/native";
import { useDispatch, useSelector } from "react-redux";

import { LOGOUT_API } from "../../config/api";
import { HTTP } from "../../config/constants";
import CoreLayoutItem from "../../layout/CoreLayoutItem";
import { apiRequestAction } from "../../store/action/appActions";
import { LOGOUT_ERROR, LOGOUT_SUCCESS } from "../../store/types/authTypes";
import CoreClasses from "../../styles/CoreClasses";
import CoreTypographyBody1 from "../dataDisplay/CoreTypographyBody1";
import CenteredBlankLayout from "../layouts/_system/CenteredBlankLayout";
import CoreBox from "../layouts/CoreBox";

export default function Logout() {
  const dispatch = useDispatch();
  let location = nativeUseLocation();
  const { acceessToken, sessionExpired } = useSelector((state) => state?.auth || {});
  const authenticated = acceessToken ? true : false;

  // -- console.log("LOCALTION", location);

  React.useEffect(() => {
    if (location?.state?.logout !== false) {
      dispatch({ type: LOGOUT_SUCCESS });
      dispatch(apiRequestAction(HTTP.POST, LOGOUT_API, true, {}, LOGOUT_SUCCESS, LOGOUT_ERROR));
    }
  }, []);

  return (
    <>
      <CoreLayoutItem id={CenteredBlankLayout.PLACEHOLDER.CONTENT}>
        {
          !authenticated ? (
            sessionExpired ? (
              <NativeDomNavigate to={"/"} state={{ sessionExpired: true }} />
            ) : (
              <NativeDomNavigate to={"/"} />
            )
          ) : (
            <CoreBox
              styleClasses={[CoreClasses.HEIGHT.VH_100, CoreClasses.ALIGNMENT.JUSTIFY_CONTENT_CENTER, CoreClasses.ALIGNMENT.ALIGN_ITEMS_CENTER]}
            >
              <CoreTypographyBody1>Signing Off...</CoreTypographyBody1>
            </CoreBox>
          ) 
        }
      </CoreLayoutItem>
    </>
  );
}
