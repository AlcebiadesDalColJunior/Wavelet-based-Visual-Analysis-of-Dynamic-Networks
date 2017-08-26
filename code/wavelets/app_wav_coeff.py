from __future__ import division

import time
import numpy as np

from math import pi

from scipy.integrate import trapz
from scipy.sparse.linalg import eigsh

from filters import filters


def coef_c(M,nScales,alpha):
    theta=np.arange(0,pi+0.001,pi/100)
    
    g=filters(2*alpha,nScales-1)
    
    c=np.zeros((nScales,M))
    a=alpha*(np.cos(theta)+1)
    for s in range(nScales):
        b=g[s](a)
        for k in range(M):
            d=np.cos(k*theta)
            y=d*b
            c[s,k]=(2/pi)*trapz(y,x=theta)
            
    return(c)

def pol_chebyshev(f,L,M,alpha):
    nNodes=L.shape[0]

    pol=np.zeros((M,nNodes))

    pol[0,:]=f
    
    sm=L.dot(f)
    pol[1,:]=((1/alpha)*sm)-f

    for k in range(2,M):
        sm=L.dot(pol[k-1,:])
        pol[k,:]=(2/alpha)*sm-2*pol[k-1,:]-pol[k-2,:]

    return(pol)

def chebyshev_approximation(f,L,nScales,M):
    nNodes=L.shape[0]
    
    lmax=eigsh(L,k=1,which='LA',return_eigenvectors=False,tol=1e-08)[0]
        
    alpha=lmax*0.5

    pol=pol_chebyshev(f,L,M,alpha)
    
    c=coef_c(M,nScales,alpha)
    
    wav_coeff=np.zeros((nScales,nNodes))
    for j in range(nNodes):
        for s in range(nScales):
            sm=0
            sm+=0.5*c[s][0]*f[j]
            sm+=np.dot(c[s,1:M],pol[1:M,j])

            wav_coeff[s,j]=sm

    return(wav_coeff)

def app_wav_coeff(f,L,nScales=8,M=40):
    start=time.time()
    wav_coeff=chebyshev_approximation(f,L,nScales,M)
    approximation_time=time.time()-start
    
    return(wav_coeff,approximation_time)