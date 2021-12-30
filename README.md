# Steam tags for Humble Bundle

This repository contains full source code of the `Steam tags for Humble Bundle` extension for Google Chrome together with backend code handling communication with Steamworks Web API.

## Description

Display "On wishlist" and "In library" tags next to games on various Humble Bundle pages based on your Steam account wishlist and library.

There are 2 ways of using this extension:

- Login to Steam website at https://store.steampowered.com/
- Enter your SteamId or CustomUrl in the extension settings

## Extension

Source code of the extension.

## Web

ExpressJS server providing simple Rest API to fetch public steam user info and list owned and wishlisted games.

## Changelog

- **v1.2:**
  - DLCs will show up correctly (only if logged in on Steam website)
  - Added `Ignored` tag that also lowers opacity of given item just like on Steam (only if logged in on Steam website)
  - Game info is automatically retrieved after you change extension settings
  - SteamId and CustomUrl input now also accepts the full profile url
- **v1.1:**
  - Added tags to `Library` and `Keys & Entitlements` pages
  - Improved game name matching (to better match items with suffixes like `(Steam)` or `XYZ edition`))
  - Added link to steam store with hover effect for tags
