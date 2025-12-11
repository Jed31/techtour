import re

file_path = '/Users/nguyenhoan/Downloads/techtour-main 2/index.html'

with open(file_path, 'r') as f:
    content = f.read()

def double_x(match):
    full_str = match.group(0) # e.g. "x: 250"
    val = int(match.group(1)) # e.g. 250
    new_val = val * 2
    return full_str.replace(str(val), str(new_val))

# Regex to find x: <number> inside tourData structure
# We assume standard formatting from previous edits
# We'll look for x: followed by digits
new_content = re.sub(r'x:\s*(-?\d+)', double_x, content)

# CAUTION: This might double the X in 'loadCityModel' calls too if they match 'x:' pattern
# But loadCityModel calls are usually `loadCityModel('...', 250)`. They don't have "x:".
# tourData has `position: { x: ... }`.

# However, we also need to update the loadCityModel calls if they were hardcoded?
# In the previous step, I hardcoded them in loadWorld as 0, 250, 500, 750.
# I will update those manually in the Javascript replace step to be clean/safe.
# This script focuses on the tourData object.

with open(file_path, 'w') as f:
    f.write(new_content)

print("Coordinates expanded (x2).")
