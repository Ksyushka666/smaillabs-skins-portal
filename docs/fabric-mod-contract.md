# Fabric mod contract

## Mod identity

- Author: **YTSmailDog**
- Project website: **https://smaillabs.onrender.com/**
- Team: **SmailLabs**

The mod metadata, in-game credits screen and README must use these values. Do not include unrelated assistant, platform or previous-task names in the mod metadata.

The Fabric mod will use the SmailLabs account profile as the source of truth for skins, capes and accessories. The website already stores both uploaded PNG files and HTTPS source URLs.

## Supported asset inputs

- PNG skin upload from the profile panel;
- PNG cape upload from the profile panel;
- HTTPS URL for a skin or cape;
- Mojang profile lookup by username;
- manual TLauncher profile with a URL or file.

Uploaded assets are represented by `skinAssets.type` (`skin`, `cape`, `accessory`) and are attached to a `skinLoadout`.

## Profile query

For a first compatible implementation, the mod can call the tRPC endpoint:

```text
GET /api/trpc/minecraft.profile?input={"json":{"uuid":"8667ba71-b85a-4004-af54-457a9734eed7"}}
```

The returned data contains:

```json
{
  "minecraftUuid": "8667ba71-b85a-4004-af54-457a9734eed7",
  "minecraftName": "YTSmailDog",
  "source": "mojang",
  "skin": {
    "url": "https://textures.minecraft.net/texture/...",
    "model": "classic",
    "hash": null
  },
  "cape": null,
  "accessories": []
}
```

The dedicated REST endpoint can be added later without changing the database contract.

## Version strategy

The mod should use a shared common module plus one Fabric loader module per Minecraft version. The initial target matrix is:

- 1.20.1;
- 1.21.1;
- 1.21.4.

The version-specific modules handle Minecraft rendering mappings, while the common module handles JSON parsing, HTTPS requests, bounded file caching and profile selection.

## Local fallback

The mod may load a local profile file for offline use:

```json
{
  "profile": "YTSmailDog",
  "skinUrl": "https://example.com/skin.png",
  "capeUrl": "https://example.com/cape.png",
  "model": "classic"
}
```

Only HTTPS URLs should be accepted. The mod must enforce a maximum download size, verify PNG content, cache by SHA-256 when available, and never send website access tokens to a Minecraft server.
