/**
 * Retrieves information about pin jobs from the Pinata API.
 *
 * This function fetches a list of pin jobs based on the provided configuration and options.
 * Pin jobs represent the status of pinning operations in progress or completed.
 *
 * @async
 * @function pinJobs
 * @param {PinataConfig | undefined} config - The Pinata configuration object containing the JWT.
 * @param {PinJobQuery} [options] - Optional query parameters to filter and paginate the results.
 * @param {string} [options.ipfs_pin_hash] - Filter by the IPFS hash (CID) of the content being pinned.
 * @param {('prechecking'|'retrieving'|'expired'|'over_free_limit'|'over_max_size'|'invalid_object'|'bad_host_node')} [options.status] - Filter by the status of the pin job.
 * @param {('ASC'|'DSC')} [options.sort] - Sort order for the results (ascending or descending).
 * @param {number} [options.limit] - Number of items to return per page.
 * @param {number} [options.offset] - Number of items to skip (for pagination).
 * @returns {Promise<PinJobItem[]>} A promise that resolves to an array of PinJobItem objects.
 * @throws {ValidationError} If the Pinata configuration or JWT is missing.
 * @throws {AuthenticationError} If the authentication fails (e.g., invalid JWT).
 * @throws {NetworkError} If there's a network-related error during the API request.
 * @throws {PinataError} For any other errors that occur during the pin jobs retrieval process.
 *  @example
 *  import { PinataSDK } from "pinata";
 *
 *  const pinata = new PinataSDK({
 *    pinataJwt: process.env.PINATA_JWT!,
 *    pinataGateway: "example-gateway.mypinata.cloud",
 *  });
 *  const jobs = await pinata.pinJobs().status("prechecking")
 */

import type {
	PinJobItem,
	PinJobQuery,
	PinJobResponse,
	PinataConfig,
} from "../types";
import {
	PinataError,
	NetworkError,
	AuthenticationError,
	ValidationError,
} from "../../utils/custom-errors";

export const pinJobs = async (
	config: PinataConfig | undefined,
	options?: PinJobQuery,
): Promise<PinJobItem[]> => {
	if (!config || !config.pinataJwt) {
		throw new ValidationError("Pinata configuration or JWT is missing");
	}

	const params = new URLSearchParams({
		includesCount: "false",
	});

	if (options) {
		const { ipfs_pin_hash: cid, status, sort, limit, offset } = options;

		if (cid) params.append("ipfs_pin_hash", cid.toString());
		if (status) params.append("status", status.toString());
		if (sort) params.append("sort", sort.toString());
		if (limit) params.append("limit", limit.toString());
		if (offset) params.append("offset", offset.toString());
	}

	const url = `https://api.pinata.cloud/pinning/pinJobs?${params.toString()}`;

	const headers: Record<string, string> = {
		Authorization: `Bearer ${config?.pinataJwt}`,
	};

	if (config.customHeaders) {
		Object.assign(headers, config.customHeaders);
	}

	// biome-ignore lint/complexity/useLiteralKeys: non-issue
	headers["Source"] = headers["Source"] || "sdk/pinJobs";

	try {
		const request = await fetch(url, {
			method: "GET",
			headers: headers,
		});
		if (!request.ok) {
			const errorData = await request.json();
			if (request.status === 401) {
				throw new AuthenticationError(
					"Authentication failed",
					request.status,
					errorData,
				);
			}
			throw new NetworkError(
				`HTTP error! status: ${request.status}`,
				request.status,
				errorData,
			);
		}
		const res: PinJobResponse = await request.json();
		return res.rows;
	} catch (error) {
		if (error instanceof PinataError) {
			throw error;
		}
		if (error instanceof Error) {
			throw new PinataError(`Error processing pinJobs: ${error.message}`);
		}
		throw new PinataError("An unknown error occurred while listing pin jobs");
	}
};
