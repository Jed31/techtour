import re

file_path = '/Users/nguyenhoan/Downloads/techtour-main 2/index.html'

with open(file_path, 'r') as f:
    content = f.read()

# Define shifts
# City 1: 0 -> 0 (No shift)
# City 2: 500 -> 250 (Shift -250)
# City 3: 1000 -> 500 (Shift -500)
# City 4: 1500 -> 750 (Shift -750)

def adjust_line(match):
    full_line = match.group(0)
    
    # Identify which city block we are in based on key names or position values
    # We can try to guess based on the X value range
    
    # Extract X value
    x_match = re.search(r'x:\s*(-?\d+)', full_line)
    if not x_match:
        return full_line
        
    x = int(x_match.group(1))
    
    # Determine shift based on X range
    # City 1: approx -50 to 50 -> No shift
    # City 2: approx 450 to 650 -> -250
    # City 3: approx 950 to 1150 -> -500
    # City 4: approx 1450 to 1650 -> -750
    
    new_x = x
    if 400 <= x <= 700:
        new_x = x - 250
    elif 900 <= x <= 1200:
        new_x = x - 500
    elif 1400 <= x <= 1700:
        new_x = x - 750
        
    return full_line.replace(f'x: {x}', f'x: {new_x}')

# Update tourData positions
# Regex finds lines with position: { x: ... } or lookAt: { x: ... }
# Iterate line by line to be safer with context
lines = content.split('\n')
new_lines = []

for line in lines:
    if 'x:' in line and ('position:' in line or 'lookAt:' in line):
        # It's a coordinate line in tourData
        line = re.sub(r'x:\s*-?\d+', adjust_line, line)
    
    # Update loadCityModel calls
    # loadCityModel('city_pack_3.glb', 500);
    if "loadCityModel('city_pack_3.glb', 500)" in line:
        line = line.replace("500", "250")
    elif "loadCityModel('city_pack_5.glb', 1000)" in line:
        line = line.replace("1000", "500")
    elif "loadCityModel('city_pack_7.glb', 1500)" in line:
        line = line.replace("1500", "750")
        
    new_lines.append(line)

new_content = '\n'.join(new_lines)

with open(file_path, 'w') as f:
    f.write(new_content)

print("Coordinates adjusted.")
