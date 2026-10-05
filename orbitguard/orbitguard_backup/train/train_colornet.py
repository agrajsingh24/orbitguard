"""Trains ColorNet (4-12-3 MLP) on a synthetic HSV dataset -> model/colornet.js (+ .json). Run: python train/train_colornet.py"""
import numpy as np, json, os
from sklearn.neural_network import MLPClassifier
rng=np.random.default_rng(7); U=rng.uniform
def feats(h,s,v):
    r=np.radians(h); return np.stack([np.sin(r),np.cos(r),s,v],1)
N=6000
hr=np.concatenate([U(-16,16,N)])%360;  red=(hr,U(.55,1,N),U(.25,1,N))
yl=(U(40,66,N),U(.55,1,N),U(.4,1,N))
bg=[(U(0,360,N),U(0,.2,N),U(0,1,N)),                  # gray/white/black
    (U(0,360,N),U(0,1,N),U(0,.2,N)),                  # dark
    (U(8,38,N),U(.15,.5,N),U(.3,.95,N)),              # skin / wood / hand
    (U(18,36,N//2),U(.5,1,N//2),U(.3,1,N//2)),        # orange
    (U(70,360,2*N)%360,U(.2,1,2*N),U(.2,1,2*N)),      # green/blue/purple/pink
    (U(330,345,N//2),U(.3,1,N//2),U(.2,1,N//2))]      # magenta (red-neighbour)
X=[feats(*red),feats(*yl)]+[feats(*b) for b in bg]
y=[np.ones(N),2*np.ones(N)]+[np.zeros(len(b[0])) for b in bg]
X=np.vstack(X); y=np.concatenate(y).astype(int)
X+=rng.normal(0,.015,X.shape)                         # sensor noise
idx=rng.permutation(len(X)); X,y=X[idx],y[idx]; k=int(.85*len(X))
clf=MLPClassifier((12,),activation='relu',max_iter=400,random_state=1).fit(X[:k],y[:k])
print('val accuracy: %.4f'%clf.score(X[k:],y[k:]))
r=lambda a:np.round(a,4).tolist()
m={'name':'ColorNet-4-12-3','W1':r(clf.coefs_[0]),'b1':r(clf.intercepts_[0]),'W2':r(clf.coefs_[1]),'b2':r(clf.intercepts_[1]),'classes':['background','red','yellow']}
os.makedirs('model',exist_ok=True)
json.dump(m,open('model/colornet.json','w'),separators=(',',':'))
open('model/colornet.js','w').write('window.COLORNET='+json.dumps(m,separators=(',',':'))+';')
print('model size: %.1f KB'%(os.path.getsize('model/colornet.js')/1024))
