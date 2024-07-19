/**
 * Uploads multiple file types
 * @returns message
 */

import type {
  PinataConfig,
  GroupResponseItem,
  GetGroupOptions,
} from "../types";

export const getGroup = async (
  config: PinataConfig | undefined,
  options: GetGroupOptions,
): Promise<GroupResponseItem> => {
  const request = await fetch(
    `https://api.pinata.cloud/groups/${options.groupId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config?.pinataJwt}`,
      },
    },
  );
  const res: GroupResponseItem = await request.json();
  if (!request.ok) {
    throw new Error("Problem fetching Group");
  }
  return res;
};
