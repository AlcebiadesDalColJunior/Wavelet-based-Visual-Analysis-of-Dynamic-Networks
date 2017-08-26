from __future__ import division

import numpy as np
import scipy.optimize as opt

def filters(lmax,n_scales,lpfactor=20,a=2,b=2,t1=1,t2=2):
    g=abspline3(lmax,n_scales,lpfactor,a,b,t1,t2)
    
    return(g)

def abspline3(lmax,n_scales,lpfactor,a,b,t1,t2):
    lmin=lmax/lpfactor
    t=log_scales(lmin,lmax,n_scales)
    
    gb=lambda x: kernel_abspline3(x,a,b,t1,t2)
    
    g=[None]*(n_scales+1)
    for j in range(n_scales):
        g[j+1]=lambda x, t=t[j]: gb(t*x)
        
    f=lambda x: -gb(x)
    xstar=opt.fminbound(f,1,2)

    gamma_l=-f(xstar)
    lminfac=0.6*lmin
    
    gl=lambda x: np.exp(-x**4)
    g[0]=lambda x: gamma_l*gl(x/lminfac)
    
    return(g)

def log_scales(lmin,lmax,n_scales,t1=1,t2=2):
  smin=t1/lmax
  smax=t2/lmin
  
  return(np.exp(np.linspace(np.log(smax),np.log(smin),n_scales)))
  
def kernel_abspline3(x,alpha,beta,t1,t2):
    x=np.array(x)
    r=np.zeros(x.shape)
    
    a=np.array([-5,11,-6,1])
    
    r1=(x>=0)&(x<t1)
    r2=(x>=t1)&(x<t2)
    r3=x>=t2
    
    r[r1]=x[r1]**alpha*t1**(-alpha)
    r[r2]=a[0]+a[1]*x[r2]+a[2]*x[r2]**2+a[3]*x[r2]**3
    r[r3]=x[r3]**(-beta)*t2**(beta)
    
    return(r)