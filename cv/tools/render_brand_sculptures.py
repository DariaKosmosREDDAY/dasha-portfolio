"""Render the existing CV brands as rounded glossy solids.

Offline asset tool using Pillow and NumPy; the website needs neither dependency.
Use --font with the site's Arial Bold font path on systems other than macOS.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, math, argparse

FONT = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
PALETTE = [(194,180,230),(230,185,202),(209,237,121)]
BRANDS = ['Сбер','VK','Яндекс','Авито','Т-Банк','Альфа-Банк','МТС','Roche','Билайн','Циан','СИБУР','Газпром','ВкусВилл','Северсталь','Xiaomi','Ростелеком','Магнит','Redmi','Mars']
SLUGS = ['sber','vk','yandex','avito','t-bank','alfa-bank','mts','roche','beeline','cian','sibur','gazprom','vkusvill','severstal','xiaomi','rostelecom','magnit','redmi','mars']

def sample(field, x, y):
    hh, ww = field.shape
    xx, yy = np.clip(x,0,ww-1), np.clip(y,0,hh-1)
    ix, iy = xx.astype(np.int32), yy.astype(np.int32)
    fx, fy = xx-ix, yy-iy
    jx, jy = np.minimum(ix+1,ww-1), np.minimum(iy+1,hh-1)
    return ((field[iy,ix]*(1-fx)+field[iy,jx]*fx)*(1-fy)+(field[jy,ix]*(1-fx)+field[jy,jx]*fx)*fy)

def distance_to_background(mask):
    # Exact separable squared Euclidean distance transform, vectorized by row.
    def axis(f):
        n,m=f.shape
        cols=np.arange(m)
        v=np.zeros((n,m),dtype=np.int32)
        z=np.zeros((n+1,m),dtype=np.float32)
        z[0]=-1e10;z[1]=1e10
        k=np.zeros(m,dtype=np.int32)
        for q in range(1,n):
            p=v[k,cols]
            sep=((f[q]-f[p,cols])+q*q-p*p)/(2*(q-p))
            while np.any(sep<=z[k,cols]):
                pop=(sep<=z[k,cols])&(k>0)
                if not np.any(pop):break
                k[pop]-=1
                p=v[k,cols]
                sep=((f[q]-f[p,cols])+q*q-p*p)/(2*(q-p))
            k+=1;v[k,cols]=q;z[k,cols]=sep;z[k+1,cols]=1e10
        result=np.zeros_like(f);k[:]=0
        for q in range(n):
            while np.any(z[k+1,cols]<q):
                k[z[k+1,cols]<q]+=1
            p=v[k,cols]
            result[q]=(q-p)**2+f[p,cols]
        return result
    f=np.where(mask,1e6,0).astype(np.float32)
    return np.sqrt(axis(axis(f).T).T)

def smooth(field):
    p=np.pad(field,1,mode='edge')
    return (p[:-2,:-2]+2*p[:-2,1:-1]+p[:-2,2:]+2*p[1:-1,:-2]+4*p[1:-1,1:-1]+2*p[1:-1,2:]+p[2:,:-2]+2*p[2:,1:-1]+p[2:,2:])/16

def normalize(v): return v / np.maximum(np.linalg.norm(v,axis=-1,keepdims=True),1e-8)

def render(word, index, font_path=FONT):
    size=230
    font=ImageFont.truetype(font_path,size)
    box=font.getbbox(word)
    padding=70
    mask=Image.new('L',(box[2]-box[0]+2*padding,box[3]-box[1]+2*padding))
    ImageDraw.Draw(mask).text((padding-box[0],padding-box[1]),word,font=font,fill=255,stroke_width=3)
    # The soft alpha profile defines a continuously domed, rounded solid.
    # There is no flat text face, extrusion stack, CSS shadow or external font.
    softened=np.asarray(mask.filter(ImageFilter.GaussianBlur(size*.027)),dtype=np.float32)/255
    silhouette=softened>.42
    distance=distance_to_background(silhouette)
    depth=size*(.25,.28,.26)[index%3]
    dome=np.asarray(mask.filter(ImageFilter.GaussianBlur(size*.058)),dtype=np.float32)/255
    dome=np.clip((dome-.22)/.78,0,1)
    # A broad curved body and a short edge falloff retain every letter counter.
    height=depth*np.sqrt(dome)*np.sqrt(1-np.exp(-distance/(size*.015)))
    height=smooth(smooth(smooth(height)))
    gy,gx=np.gradient(height)
    yaw=math.radians((-9,8,-6)[index%3]); pitch=math.radians((10,-8,7)[index%3])
    cy,sy,cp,sp=math.cos(yaw),math.sin(yaw),math.cos(pitch),math.sin(pitch)
    U=np.array([cy,0,-sy],dtype=np.float32)
    W=np.array([sy*sp,cp,cy*sp],dtype=np.float32)
    V=np.cross(U,W)
    hh,ww=height.shape
    yy,xx=np.mgrid[0:hh,0:ww].astype(np.float32)
    xx-=ww/2; yy-=hh/2
    px=xx*U[0]+yy*W[0]+ww/2
    py=xx*U[1]+yy*W[1]+hh/2
    pz=xx*U[2]+yy*W[2]
    active=np.ones(height.shape,dtype=bool)
    hit=np.zeros(height.shape,dtype=bool)
    surface=np.zeros(height.shape,dtype=np.float32)
    # Orthographic ray intersections with the inflated glyph surface.
    near=depth+ww*abs(V[0])*.65+hh*abs(V[1])*.65+30
    far=-near
    previous=np.full(height.shape,near,dtype=np.float32)
    for t in np.linspace(near,far,100):
        z=pz+t*V[2]
        h=sample(height,px+t*V[0],py+t*V[1])
        crossed=active&(h>.03)&(z<=h)&(z>=-h)
        if np.any(crossed):
            hi=previous[crossed].copy(); lo=np.full(hi.shape,t,dtype=np.float32)
            x,y,z0=px[crossed],py[crossed],pz[crossed]
            for _ in range(8):
                mid=(hi+lo)/2
                outside=z0+mid*V[2]>sample(height,x+mid*V[0],y+mid*V[1])
                hi=np.where(outside,mid,hi); lo=np.where(outside,lo,mid)
            surface[crossed]=(hi+lo)/2
            hit[crossed]=True; active[crossed]=False
        previous[active]=t
    x=px+surface*V[0]; y=py+surface*V[1]
    normal=normalize(np.stack([-sample(gx,x,y),-sample(gy,x,y),np.ones_like(x)],axis=-1))
    view=np.broadcast_to(V,normal.shape)
    base=(np.array(PALETTE[index%3],dtype=np.float32)/255)**2.2
    key=normalize(np.array([-.46,-.62,1.0],dtype=np.float32))
    fill=normalize(np.array([.8,.15,.75],dtype=np.float32))
    ndv=np.clip(np.sum(normal*view,axis=-1),0,1)
    ndl=np.clip(np.sum(normal*key,axis=-1),0,1)
    ndf=np.clip(np.sum(normal*fill,axis=-1),0,1)
    diffuse=.28+.55*ndl+.2*ndf
    # Broad studio softboxes reflect across the curved letter surfaces.
    reflection=2*normal*ndv[...,None]-view
    rx,ry,rz=reflection[...,0],reflection[...,1],reflection[...,2]
    whitebox=np.exp(-((rx+.36)/.24)**4-((ry+.30)/.63)**6)*np.clip(rz,0,1)
    rimbox=np.exp(-((rx-.57)/.14)**4-((ry-.05)/.48)**4)*np.clip(rz,0,1)
    half=normalize(key+V)
    spec=np.clip(np.sum(normal*half,axis=-1),0,1)**72
    sheen=(1-ndv)**3
    color=base[None,None,:]*diffuse[...,None]
    color+=whitebox[...,None]*1.25+rimbox[...,None]*.6+spec[...,None]*.6
    color+=sheen[...,None]*(base*.24+.10)
    # A subdued pink/lilac studio bounce adds material variation within the palette.
    bounce=np.exp(-((rx+.1)/.7)**2-((ry-.55)/.25)**2)*.14
    color+=bounce[...,None]*np.array([.68,.47,.79],dtype=np.float32)
    color=np.clip(color,0,1)**(1/2.2)
    rgba=np.dstack([(color*255).astype(np.uint8),hit.astype(np.uint8)*255])
    image=Image.fromarray(rgba,'RGBA')
    # Supersampled source keeps the rendered domes and curved highlights crisp.
    bounds=image.getbbox()
    image=image.crop((max(0,bounds[0]-5),max(0,bounds[1]-5),min(ww,bounds[2]+5),min(hh,bounds[3]+5)))
    return image

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--font',default=FONT)
    args=parser.parse_args()
    out=Path('assets/cv-brand-sculptures');out.mkdir(parents=True,exist_ok=True)
    for i,word in enumerate(BRANDS):
        im=render(word,i,args.font)
        im.save(out/(SLUGS[i]+'.webp'),lossless=True,method=6)
        print(word,im.size,flush=True)
