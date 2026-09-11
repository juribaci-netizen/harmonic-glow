import { deflateSync } from 'node:zlib'
import { PNG } from 'pdf-lib/cjs/utils/png'

function chunk(type:string,data:Buffer) {
  const body=Buffer.concat([Buffer.from(type),data]);let crc=0xffffffff
  for(const byte of body){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
  const size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE((crc^0xffffffff)>>>0)
  return Buffer.concat([size,body,sum])
}
// Trim empty canvas margins for display/export; the saved original is untouched.
export function fittedSignature(data:string|null):string|null {
  if(!data)return null
  try {
    const png=PNG.load(Buffer.from(data.split(',')[1],'base64'))
    if(png.width*png.height>4_000_000)return data
    let left=png.width,top=png.height,right=-1,bottom=-1
    for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){
      const i=y*png.width+x,a=png.alphaChannel?.[i]??255
      if(a>16&&Math.min(...png.rgbChannel.subarray(i*3,i*3+3))<240){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
    }
    if(right<left)return data
    left=Math.max(0,left-3);top=Math.max(0,top-3);right=Math.min(png.width-1,right+3);bottom=Math.min(png.height-1,bottom+3)
    const width=right-left+1,height=bottom-top+1,rows=Buffer.alloc(height*(1+width*4))
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const source=(y+top)*png.width+x+left,target=y*(1+width*4)+1+x*4
      rows[target]=png.rgbChannel[source*3];rows[target+1]=png.rgbChannel[source*3+1];rows[target+2]=png.rgbChannel[source*3+2];rows[target+3]=png.alphaChannel?.[source]??255
    }
    const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6
    return 'data:image/png;base64,'+Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]).toString('base64')
  }catch{return data}
}
