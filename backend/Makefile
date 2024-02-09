# This is the default target, which will be built when 
# you invoke make
.PHONY: all
all: rgbctrl

rgbctrl:
	mkdir -p ./out
	gcc -o ./out/rgbctrl ./src/main.c -lusb-1.0
	cp /usr/lib/libusb-1.0.so ./out/libusb-1.0.so

.PHONY: clean 
clean:
	rm -f rgbctrl