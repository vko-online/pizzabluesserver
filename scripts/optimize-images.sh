#!/bin/bash

find js -name '*.png' -exec pngcrush -ow {} \;
