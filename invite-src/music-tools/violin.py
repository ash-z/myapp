import numpy as np, scipy.signal as sg, scipy.ndimage as nd, soundfile as sf, pickle
d=np.load('pitch2.npz'); f0=d['f0']; rms=d['rms']; hop=int(d['hop']); fsr=int(d['sr']); dt=hop/fsr; N=len(f0); SR=44100
lf=np.log2(f0); loc=nd.median_filter(lf,81); dv=lf-loc; lf=np.where(dv>0.6,lf-1,np.where(dv<-0.6,lf+1,lf))
midi=nd.median_filter(12*lf+69-12*np.log2(440),5)
notes=pickle.load(open('notes_snap.pkl','rb'))
center=np.full(N,np.nan); on=np.zeros(N,bool)
for a,b,m in notes: center[a:b]=m; on[a:b]=True
idx=np.where(~np.isnan(center))[0]; center=np.interp(np.arange(N),idx,center[idx])     # hold pitch through rests
expr=np.where(on,0.5*np.clip(midi-center,-0.3,0.3),0.0)                                    # singer's own vibrato & scoops, kept small
expr=nd.gaussian_filter1d(nd.median_filter(expr,5),2)
track=nd.gaussian_filter1d(center,6)+expr+12                                            # ~35 ms glide between notes; violin octave
amp=np.where(on,rms,0.0); amp=(amp/amp.max())**0.6
a=np.zeros(N)
for i in range(1,N):
    k=0.10 if amp[i]>a[i-1] else 0.05                                                    # bowed: soft attack, gentle release
    a[i]=a[i-1]+k*(amp[i]-a[i-1])
tf=np.arange(N)*dt; ta=np.arange(int(N*dt*SR))/SR
T=np.interp(ta,tf,track); A=np.interp(ta,tf,a)
rng=np.random.default_rng(5); L=len(ta); outL=np.zeros(L); outR=np.zeros(L)
for j,(cents,delay,pan) in enumerate(((-7,0.000,0.35),(0,0.012,0.5),(6,0.021,0.65),(-3,0.030,0.45))):
    jit=np.interp(ta,tf,nd.gaussian_filter1d(rng.standard_normal(N),0.15/dt)*np.sqrt(0.15/dt))*0.08   # each player a touch different
    vib=0.12*np.sin(2*np.pi*(5.3+0.3*j)*ta+j)                                          # light violin vibrato on top
    f=440*2**((T+vib+jit+cents/100-69)/12)
    ph=2*np.pi*np.cumsum(f)/SR+rng.uniform(0,6.28)
    x=np.zeros(L)
    for h in range(1,24):
        if 440*2**((81-69)/12)*h>11000 and h>8: break
        x+=np.sin(h*ph)/h*(0.9**(h-1))
    dd=int(delay*SR); x=np.concatenate([np.zeros(dd),x[:L-dd]]); Ad=np.concatenate([np.zeros(dd),A[:L-dd]])
    x*=Ad
    outL+=x*(1-pan); outR+=x*pan
bow=sg.lfilter(*sg.butter(2,[2000/(SR/2),7000/(SR/2)],'band'),rng.standard_normal(L))*A*0.04
outL+=bow; outR+=bow
def body(x):   # violin body: a warm air resonance, a soft mid scoop, the bright "bridge hill", no fizz
    for fc,q,g in ((290,4,6),(480,3,3),(1500,1.5,-3),(2800,1.2,6)):
        w=2*np.pi*fc/SR; al=np.sin(w)/(2*q); Aa=10**(g/40)
        b=[1+al*Aa,-2*np.cos(w),1-al*Aa]; aa=[1+al/Aa,-2*np.cos(w),1-al/Aa]; x=sg.lfilter(b,aa,x)
    return sg.lfilter(*sg.butter(4,7500/(SR/2)),sg.lfilter(*sg.butter(2,180/(SR/2),'high'),x))
y=np.stack([body(outL),body(outR)],1); y=y[:int(216.02*SR)]; y=y/np.abs(y).max()*0.8
sf.write('violin.wav',y.astype(np.float32),SR); print('ok')
