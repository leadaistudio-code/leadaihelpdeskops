package main

import (
	"bytes"
	"encoding/binary"
)

// trayIcon builds a 16×16 solid signal-mint .ico in code, so the tray needs no
// bundled asset file. Ported from the JS agent's makeIcoBase64.
func trayIcon() []byte {
	const w, h = 16, 16

	// XOR bitmap: 32bpp BGRA, signal-mint (#12B489 → B=0x89 G=0xB4 R=0x12).
	xor := make([]byte, w*h*4)
	for i := 0; i < w*h; i++ {
		xor[i*4+0] = 0x89 // B
		xor[i*4+1] = 0xB4 // G
		xor[i*4+2] = 0x12 // R
		xor[i*4+3] = 0xFF // A
	}
	// AND mask: 1bpp, rows padded to 4 bytes.
	andRow := ((w + 31) / 32) * 4
	and := make([]byte, andRow*h)

	var bih bytes.Buffer
	binary.Write(&bih, binary.LittleEndian, uint32(40)) // header size
	binary.Write(&bih, binary.LittleEndian, int32(w))
	binary.Write(&bih, binary.LittleEndian, int32(h*2)) // height includes AND mask
	binary.Write(&bih, binary.LittleEndian, uint16(1))  // planes
	binary.Write(&bih, binary.LittleEndian, uint16(32)) // bpp
	binary.Write(&bih, binary.LittleEndian, uint32(0))  // compression
	binary.Write(&bih, binary.LittleEndian, uint32(len(xor)+len(and)))
	binary.Write(&bih, binary.LittleEndian, int32(0))
	binary.Write(&bih, binary.LittleEndian, int32(0))
	binary.Write(&bih, binary.LittleEndian, uint32(0))
	binary.Write(&bih, binary.LittleEndian, uint32(0))

	img := append(append(bih.Bytes(), xor...), and...)

	var out bytes.Buffer
	// ICONDIR
	binary.Write(&out, binary.LittleEndian, uint16(0)) // reserved
	binary.Write(&out, binary.LittleEndian, uint16(1)) // type: icon
	binary.Write(&out, binary.LittleEndian, uint16(1)) // count
	// ICONDIRENTRY
	out.WriteByte(w)
	out.WriteByte(h)
	out.WriteByte(0) // colors
	out.WriteByte(0) // reserved
	binary.Write(&out, binary.LittleEndian, uint16(1))  // planes
	binary.Write(&out, binary.LittleEndian, uint16(32)) // bpp
	binary.Write(&out, binary.LittleEndian, uint32(len(img)))
	binary.Write(&out, binary.LittleEndian, uint32(22)) // offset (6 + 16)
	out.Write(img)
	return out.Bytes()
}
