A canvas-based implementation of the Optimum Theory simulation by Gary Lee.

First attempt is in `old.html`, kept for reference.

Latest attempt is `index.html`, which has UI for managing different options.

Run by cloning the repo and opening `index.html` in a browser.

Basic sim:

- Base "energy" buffers use averaging kernel (cell + neighbors), ping-ponged between frames
- Diff buffer based on energy buffers
- "Vec-max encoding" encodes the cardinal direction of the largest gradient from "diff buffer"

Current implementation is slow due to:

- Single-threading (not planning on using web-workers due to HTTPS restriction)
- Inefficient buffer ops (buffer util is generic for any number of dimensions, which introduces overhead from conversion/validation)
- Inefficient kernel application (some kernels can be merged to deduplicate work)
- Lots of GC overhead