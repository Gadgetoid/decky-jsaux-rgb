#include <stdio.h>
#include <libusb-1.0/libusb.h>
#include <stdlib.h>

libusb_device_handle *device;
libusb_context* context = NULL;

unsigned char buf[65] = {0};

int main(int argc, char** argv) {
  long r, g, b;

  printf("Setting effect: %d\n");

  int result = libusb_init(&context);
  if (result < 0) {
    printf("Failed to init libusb!?\n");
    return result;
  }

  char* p;
  long effect = 0;
  
  if(argc == 4) {
    effect = 1;
    r = strtol(argv[1], &p, 10);
    g = strtol(argv[2], &p, 10);
    b = strtol(argv[3], &p, 10);
  } else {
    effect = strtol(argv[1], &p, 10);
    r, g, b = 0;
  }

  device = libusb_open_device_with_vid_pid(context, 0x306f, 0x1234);
  if(device == NULL) {
    printf("Failed to open device 0x306f / 0x1234\n");
    return -1;
  }

  libusb_set_configuration(device, 1);

  buf[0x00] = 0x16;
  buf[0x01] = effect; // Effect type
  buf[0x02] = 0x01; // Speed
  buf[0x03] = 0x02; // Brightness
  buf[0x11] = 0x01;
  buf[0x12] = 0x01;

  buf[0x04] = buf[0x07] = buf[0x0A] = r;
  buf[0x05] = buf[0x08] = buf[0x0B] = g;
  buf[0x06] = buf[0x09] = buf[0x0C] = b;

  result = libusb_control_transfer(device, 0x21, 9, 0x200, 0, buf, 65, 100);
  printf("Result %d\n", result);

  return 0;
}