/**
 * Removes one or more CIDs (Content Identifiers) from a specified Pinata group.
 *
 * This function allows you to disassociate multiple CIDs from a group in Pinata.
 * It's useful for managing the content within your groups without deleting the actual files.
 *
 * @async
 * @function removeFromGroup
 * @param {PinataConfig | undefined} config - The Pinata configuration object containing the JWT.
 * @param {GroupCIDOptions} options - The options for removing CIDs from a group.
 * @param {string} options.groupId - The ID of the group to remove the CIDs from.
 * @param {string[]} options.cids - An array of CIDs to remove from the group.
 * @returns {Promise<string>} A promise that resolves to a string confirming the removal.
 * @throws {ValidationError} If the Pinata configuration or JWT is missing.
 * @throws {AuthenticationError} If the authentication fails (e.g., invalid JWT).
 * @throws {NetworkError} If there's a network-related error during the API request.
 * @throws {PinataError} For any other errors that occur during the process.
 *
 * @example
 *import { PinataSDK } from "pinata";
 *
 *const pinata = new PinataSDK({
 *  pinataJwt: process.env.PINATA_JWT!,
 *  pinataGateway: "example-gateway.mypinata.cloud",
 *});
 *
 *const group = await pinata.groups.removeCids({
 *	groupId: "3778c10d-452e-4def-8299-ee6bc548bdb0",
 *	cids: ["QmVLwvmGehsrNEvhcCnnsw5RQNseohgEkFNN1848zNzdng"],
 *});
 */

import type { GroupCIDOptions, PinataConfig } from "../types";

import {
	PinataError,
	NetworkError,
	AuthenticationError,
	ValidationError,
} from "../../utils/custom-errors";

export const removeFromGroup = async (
	config: PinataConfig | undefined,
	options: GroupCIDOptions,
): Promise<string> => {
	if (!config || !config.pinataJwt) {
		throw new ValidationError("Pinata configuration or JWT is missing");
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${config?.pinataJwt}`,
	};

	if (config.customHeaders) {
		Object.assign(headers, config.customHeaders);
	}

	// biome-ignore lint/complexity/useLiteralKeys: non-issue
	headers["Source"] = headers["Source"] || "sdk/removeFromGroup";

	const data = JSON.stringify({
		cids: options.cids,
	});

	try {
		const request = await fetch(
			`https://api.pinata.cloud/groups/${options.groupId}/cids`,
			{
				method: "DELETE",
				headers: headers,
				body: data,
			},
		);

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

		const res: string = await request.text();
		return res;
	} catch (error) {
		if (error instanceof PinataError) {
			throw error;
		}
		if (error instanceof Error) {
			throw new PinataError(
				`Error processing removeFromGroup: ${error.message}`,
			);
		}
		throw new PinataError(
			"An unknown error occurred while removing CIDs from a group",
		);
	}
};
