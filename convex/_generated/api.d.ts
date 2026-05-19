/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as costs from "../costs.js";
import type * as generation from "../generation.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_assets from "../lib/assets.js";
import type * as lib_requireUser from "../lib/requireUser.js";
import type * as memories from "../memories.js";
import type * as pets from "../pets.js";
import type * as profiles from "../profiles.js";
import type * as prompts from "../prompts.js";
import type * as quotas from "../quotas.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  assets: typeof assets;
  auth: typeof auth;
  costs: typeof costs;
  generation: typeof generation;
  http: typeof http;
  jobs: typeof jobs;
  "lib/assets": typeof lib_assets;
  "lib/requireUser": typeof lib_requireUser;
  memories: typeof memories;
  pets: typeof pets;
  profiles: typeof profiles;
  prompts: typeof prompts;
  quotas: typeof quotas;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
