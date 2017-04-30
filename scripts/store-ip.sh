#!/bin/bash

DEST="$CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH"

if [[ "$CONFIGURATION" = "Debug" ]]; then
  if [[ "$PLATFORM_NAME" != "iphonesimulator" ]]; then
    ipconfig getifaddr en0 > "$DEST/ip.txt"
  fi
fi
