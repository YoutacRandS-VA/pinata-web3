import { revokeKeys } from "../../src/core/keys/revokeKeys";
import type { PinataConfig, RevokeKeyResponse } from "../../src";
import {
  PinataError,
  NetworkError,
  AuthenticationError,
  ValidationError,
} from "../../src/utils/custom-errors";

describe("revokeKeys function", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const mockConfig: PinataConfig = {
    pinataJwt: "test_jwt",
    pinataGateway: "https://test.mypinata.cloud",
  };

  const mockKeys = ["key1", "key2", "key3"];

  it("should revoke keys successfully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue("Key revoked successfully"),
    });

    const result = await revokeKeys(mockConfig, mockKeys);

    expect(global.fetch).toHaveBeenCalledTimes(3);
    mockKeys.forEach((key, index) => {
      expect(global.fetch).toHaveBeenNthCalledWith(
        index + 1,
        `https://api.pinata.cloud/v3/pinata/keys/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockConfig.pinataJwt}`,
          },
        },
      );
    });
    expect(result).toEqual([
      { key: "key1", status: "Key revoked successfully" },
      { key: "key2", status: "Key revoked successfully" },
      { key: "key3", status: "Key revoked successfully" },
    ]);
  });

  it("should throw ValidationError if config is missing", async () => {
    await expect(revokeKeys(undefined, mockKeys)).rejects.toThrow(
      ValidationError,
    );
  });

  it("should handle AuthenticationError for individual keys", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: "Unauthorized" }),
      })
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue("Key revoked successfully"),
      });

    const result = await revokeKeys(mockConfig, mockKeys);

    expect(result).toEqual([
      { key: "key1", status: "Authentication failed" },
      { key: "key2", status: "Key revoked successfully" },
      { key: "key3", status: "Key revoked successfully" },
    ]);
  });

  it("should handle NetworkError for individual keys", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: "Server Error" }),
      })
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue("Key revoked successfully"),
      });

    const result = await revokeKeys(mockConfig, mockKeys);

    expect(result).toEqual([
      {
        key: "key1",
        status: "HTTP error! status: 500",
      },
      { key: "key2", status: "Key revoked successfully" },
      { key: "key3", status: "Key revoked successfully" },
    ]);
  });

  it("should handle unexpected errors for individual keys", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Unexpected error"))
      .mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue("Key revoked successfully"),
      });

    const result = await revokeKeys(mockConfig, mockKeys);

    expect(result).toEqual([
      { key: "key1", status: "Error revoking key key1: Unexpected error" },
      { key: "key2", status: "Key revoked successfully" },
      { key: "key3", status: "Key revoked successfully" },
    ]);
  });
});