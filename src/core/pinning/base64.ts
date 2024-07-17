/**
 * Uploads multiple file types
 * @returns message
 */

import type { PinataConfig, PinResponse, UploadOptions } from "../types";

export const uploadBase64 = async (
	config: PinataConfig | undefined,
	base64String: string,
	options?: UploadOptions,
) => {
	try {
		let jwt;
		if (options && options.keys) {
			jwt = options.keys;
		} else {
			jwt = config?.pinataJwt;
		}

		const name = options?.metadata?.name
			? options?.metadata?.name
			: "base64 string";

		const buffer = Buffer.from(base64String, "base64");

		const blob = new Blob([buffer]);

		const data = new FormData();

		data.append("file", blob, name);

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

		const request = await fetch(
			`https://api.pinata.cloud/pinning/pinFileToIPFS`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
				body: data,
			},
		);
		const res: PinResponse = await request.json();
		return res;
	} catch (error) {
		throw error;
	}
};
