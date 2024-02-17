# This is the default target, which will be built when 
# you invoke make
.PHONY: all
all: python-deps # rgbctrl

python-deps:
	mkdir -p ./out
	pip install pyusb --target ./out

.PHONY: clean 
clean:
	rm -f rgbctrl