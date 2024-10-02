import * as pc from "picocolors";
import { getTime } from "./helpers";

export const TIMESTAMP_LOG_PREFIX = pc.gray(`[${getTime()}] `);

export const TSC_LOG_PREFIX = TIMESTAMP_LOG_PREFIX + pc.bgRed(pc.bold(" TSC "));

export const INTENT_LOG_PREFIX =
  TIMESTAMP_LOG_PREFIX + pc.bgRed(pc.black(" INTENT "));
