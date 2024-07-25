/**
 * Uploads multiple file types
 * @returns message
 */

import type { PinataConfig, PinResponse, UploadOptions } from "../types";

import {
	PinataError,
	NetworkError,
	AuthenticationError,
	ValidationError,
} from "../../utils/custom-errors";

export const uploadUrl = async (
	config: PinataConfig | undefined,
	url: string,
	options?: UploadOptions,
) => {
	if (!config || !config.pinataJwt) {
		throw new ValidationError("Pinata configuration or JWT is missing");
	}

	const jwt: string = options?.keys || config?.pinataJwt;
	const data = new FormData();

	const stream = await fetch(url);

	if (!stream.ok) {
		const errorData = await stream.json();
		throw new NetworkError(
			`HTTP error! status: ${stream.status}`,
			stream.status,
			errorData,
		);
	}

	const arrayBuffer = await stream.arrayBuffer();

	const blob = new Blob([arrayBuffer]);

	const name = options?.metadata?.name ?? "url_upload";

	const file = new File([blob], name);

	data.append("file", file, name);

	data.append(
		"pinataOptions",
		JSON.stringify({
			cidVersion: options?.cidVersion,
			groupId: options?.groupId,
		}),
	);

	data.append(
		"pinataMetadata",
		JSON.stringify({
			name: name,
			keyvalues: options?.metadata?.keyValues,
		}),
	);

	try {
		const request = await fetch(
			"https://api.pinata.cloud/pinning/pinFileToIPFS",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
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

		const res: PinResponse = await request.json();
		return res;
	} catch (error) {
		if (error instanceof PinataError) {
			throw error;
		}
		if (error instanceof Error) {
			throw new PinataError(`Error processing url: ${error.message}`);
		}
		throw new PinataError("An unknown error occurred while uploading by url");
	}
};
