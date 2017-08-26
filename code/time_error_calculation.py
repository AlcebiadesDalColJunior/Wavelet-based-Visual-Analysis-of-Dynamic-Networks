from __future__ import division

import numpy as np
import networkx as nx

from wavelets.filters import filters
from wavelets import app_wav_coeff

import util
from conf import getConf


datasets_to_run='synthetic'

if (datasets_to_run == 'all'):
    datasets_to_run=['synthetic','thiers_2011','thiers_2012','thiers_2013',
                     'primary_school','hospital','imdb1']
                     
if type(datasets_to_run) is not list:
        datasets_to_run=[datasets_to_run]

M_array=[10,20,30,40,50,60]

nScales=8
nIterations=1000

folder='datasets/'

for name in datasets_to_run:
    conf=getConf(name)
    basename=folder+name
    
    
    ## Loading data from file ##
    
    
    node_labels,classes=util.load_nodes(basename,conf)
    
    nNodes=len(node_labels)
        
    edges=util.load_edges(basename)
    
    nTimeSlices=len(edges)
    # Comment the line below to run the whole dataset
    nTimeSlices=5
    
    if (conf.read_edge_weights):
        weights=util.load_edge_weights(basename)
        
    edge_weights=dict()
    for i in range(nTimeSlices):
        for j in range(len(edges[i])):
            if (edges[i] != [[None,None]]):
                node0=edges[i][j][0]
                node1=edges[i][j][1]
                
                if (conf.read_edge_weights):
                    edge_weights[((node0,i),(node1,i))]=weights[i][j]
                else:
                    edge_weights[((node0,i),(node1,i))]=conf.spatial_weight
    
    # Time labels for context (time_labels) and mouse over (time_labels_per_hour)
    if (conf.read_time_labels):
        time_labels,time_labels_per_hour=util.load_time_labels(basename)
    else:
        time_labels=[str(i) for i in range(nTimeSlices)]
        time_labels_per_hour=time_labels[:]
    
    if (conf.read_signal):
        f=np.genfromtxt(basename+'_signal',delimiter=';',usecols=range(nNodes))
    
    
    ## Handling dynamic network ##
    
    
    # Creating base of nodes
    G=nx.empty_graph(nNodes)
    
    # Adding temporal edges
    H=util.path_graph_weighted(nTimeSlices,conf.temporal_weight)
    GH=nx.cartesian_product(G,H)
    
    # Adding spatial edges
    for edge in edge_weights.keys():
        GH.add_edge(edge[0],edge[1],weight=edge_weights[edge])
    
    # Laplacian matrix  
    index=0
    nodelist=[]
    spatial_neighbors=dict()
    for tm in range(nTimeSlices):
        for node in range(nNodes):
            nodelist.append((node,tm))
            spatial_neighbors[(node,tm)]=GH[(node,tm)]
    
    L=nx.laplacian_matrix(GH,nodelist=nodelist).asfptype()
    
    # Graph signal calculation
    if (not conf.read_signal):
        f=np.zeros((nTimeSlices,nNodes))
        for tm in range(nTimeSlices):
            for node in range(nNodes):
                sn=spatial_neighbors[(node,tm)]
                
                for neighbor in sn.keys():
                    if (neighbor[1] == tm):
                        f[tm,node]+=sn[neighbor]['weight']   
    
    # Network signal calculation
    f_network=np.sum(f,axis=1)
    
    f=f.ravel()
    
    nTotalNodes=nTimeSlices*nNodes
    
    
    Lambda,U=np.linalg.eigh(L.toarray())
    lmax=np.max(Lambda)
    g=filters(lmax,nScales-1)
    
    # Graph Fourier transform
    fhat=np.zeros((nTotalNodes,))
    for ell in range(nTotalNodes):
        for j in range(nTotalNodes):
            fhat[ell]+=U[j,ell]*f[j]
    
    # Calculation of the wavelet coefficients (without the Hammond et al. approximation)
    wav_coeff_exact=np.zeros((nScales,nTotalNodes))
    for j in range(nTotalNodes):
        for scale in range(nScales):
            for ell in range(nTotalNodes):
                wav_coeff_exact[scale,j]+=g[scale](Lambda[ell])*fhat[ell]*U[j,ell]
    
    app_time=[]
    app_error=[]
    for M in M_array:
        app_time_array=[]
        for interaction in range(nIterations): 
            wav_coeff,current_app_time=app_wav_coeff(f,L,nScales,M)
            app_time_array.append(current_app_time)
        
        app_time.append(sum(app_time_array)/nIterations)
        
        diff=[]
        for i in range(nTotalNodes):
            for j in range(nScales):
                diff.append(abs(wav_coeff[j,i]-wav_coeff_exact[j,i]))
            
        current_error=sum(diff)
        app_error.append(current_error)
        
    np.savetxt('app_time_'+name,app_time)
    np.savetxt('app_error_'+name,app_error)