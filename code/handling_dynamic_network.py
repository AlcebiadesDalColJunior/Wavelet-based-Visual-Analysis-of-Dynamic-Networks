from __future__ import division

import os
import time
import shutil

import numpy as np
import networkx as nx

from sklearn.preprocessing import robust_scale

import util

from conf import getConf
from wavelets import app_wav_coeff


# Use X, [X,Y,...], or 'all' for all datasets listed below

# Enter your own data too
# Minimum requirements: XX_edges, XX_labels (save on datasets file)
# You may want to configure other settings at conf.py

datasets_to_run='all'

if (datasets_to_run == 'all'):
    datasets_to_run=['synthetic','thiers_2011','thiers_2012','thiers_2013',
                     'primary_school','hospital','imdb1']

# Rebuild the graph layout
rebuild_layout=False

folder='datasets/'


if type(datasets_to_run) is not list:
        datasets_to_run=[datasets_to_run]

for name in datasets_to_run:
    conf=getConf(name)
    basename=folder+name
    
    
    ## Loading data from file ##
    
    
    node_labels,classes=util.load_nodes(basename,conf)
    
    nNodes=len(node_labels)
        
    edges=util.load_edges(basename)
    
    nTimeSlices=len(edges)
    
    if (conf.read_edge_weights):
        weights=util.load_edge_weights(basename)
    
    # time_labels for context, and time_labels_per_hour for mouse over
    if (conf.read_time_labels):
        time_labels,time_labels_per_hour=util.load_time_labels(basename)
    else:
        time_labels=[str(i) for i in range(nTimeSlices)]
        time_labels_per_hour=time_labels[:]
    
    if (conf.read_signal):
        f=np.genfromtxt(basename+'_signal',delimiter=';',usecols=range(nNodes))
    
    
    ## Handling dynamic network ##
    
    
    start=time.time()
    
    # Creating base of nodes
    G=nx.empty_graph(nNodes)
    
    # Adding temporal edges
    H=util.path_graph_weighted(nTimeSlices,conf.temporal_weight)
    
    # Cartesian product graph
    GH=nx.cartesian_product(G,H)
    
    # Adding spatial edges
    for i in range(nTimeSlices):
        if (edges[i] != [[None,None]]):
            for j in range(len(edges[i])):
                node0=edges[i][j][0]
                node1=edges[i][j][1]
                
                if (conf.read_edge_weights):
                    GH.add_edge((node0,i),(node1,i),weight=weights[i][j])
                else:
                    GH.add_edge((node0,i),(node1,i),weight=conf.spatial_weight)
    
    nodelist=[]
    GH_neighbors=dict()
    for tm in range(nTimeSlices):
        for node in range(nNodes):
            nodelist.append((node,tm))
            GH_neighbors[(node,tm)]=GH[(node,tm)]
            
    # Laplacian matrix
    L=nx.laplacian_matrix(GH,nodelist=nodelist).asfptype()
    
    nTotalNodes=nTimeSlices*nNodes
    
    nSpatialNeighbors=dict()
    for i in range(nTotalNodes):
        nSpatialNeighbors[nodelist[i]]=0
        neighborhood=GH_neighbors[nodelist[i]]
        
        for neighbor in neighborhood.keys():
            if (neighbor[1] == nodelist[i][1]):
                nSpatialNeighbors[nodelist[i]]+=1
    
    # Graph signal calculation
    if (not conf.read_signal):
        f=np.zeros((nTimeSlices,nNodes))
        for tm in range(nTimeSlices):
            for node in range(nNodes):
                neighborhood=GH_neighbors[(node,tm)]
                
                for neighbor in neighborhood.keys():
                    if (neighbor[1] == tm):
                        f[tm,node]+=neighborhood[neighbor]['weight']
                            
    # Network signal calculation
    f_network=np.sum(f,axis=1)
    
    # Approximation of the wavelet coefficients
    wav_coeff,app_time=app_wav_coeff(f.ravel(),L)
    
    nScales=wav_coeff.shape[0]
    
    # Preprocessing wavelet coefficients
    wav_coeff=np.abs(wav_coeff.T)
    wav_coeff=robust_scale(wav_coeff,with_centering=False)
    
    # Normalization of wavelet coefficients
    maxCoef=np.amax(wav_coeff,axis=0)
    wav_coeff=np.log(1+wav_coeff)/np.log(1+maxCoef)
    
    # Calculating torque
    torque=np.sum(wav_coeff*[-4,-3,-2,-1,1,2,3,4],axis=1)/10.0
        
    # Defining node classes
    node_class=np.zeros((nTotalNodes,),dtype=np.int)
    
    # Isolated nodes in a given time slice are assigned to the Zero class
    for i in range(nTotalNodes):
        if (nSpatialNeighbors[nodelist[i]] == 0):
            node_class[i]=1

    node_class_aux=np.zeros((7,nTotalNodes),dtype=np.int)
    
    node_class_aux[1,:]=(node_class==1)
    node_class_aux[2,:]=np.less_equal(torque,-0.3)
    node_class_aux[3,:]=np.logical_and(-0.3 < torque,torque <= -0.05)
    node_class_aux[4,:]=np.logical_and(-0.05 < torque,torque <= 0.05)
    node_class_aux[5,:]=np.logical_and(0.05 < torque,torque <= 0.3)
    node_class_aux[6,:]=np.greater(torque,0.3)

    node_class=np.argmax(node_class_aux,axis=0)
    node_class=node_class.reshape((nTimeSlices,nNodes))
    
    torque=torque.reshape((nTimeSlices,nNodes))

    # Defining network classes       
    network_class_aux=np.zeros((7,nTimeSlices))
    for i in range(2,7):
        network_class_aux[i,:]=np.sum(node_class==i,axis=1)
        if (np.max(network_class_aux[i,:]) > 0):
            network_class_aux[i,:]/=np.max(network_class_aux[i,:])
    
    network_class=np.argmax(network_class_aux,axis=0)
    network_class[np.where(network_class==0)]=1
    
    
    ## Setting the graph layout based on the classes ##
    
    
    if (conf.read_pos):
        xy=util.load_pos(basename)
        rebuild_layout=True
    else:
        layout=nx.empty_graph(nNodes)
        for i in range(nNodes):
            for j in range(i+1,nNodes):
                layout.add_edge(i,j)
                
                if (classes[i] == classes[j]):
                    layout.edge[i][j]['weight']=10*conf.weight
                else:
                    layout.edge[i][j]['weight']=conf.weight
        
        xy=nx.spring_layout(layout,weight='weight')
        
        for i in range(nNodes):
            xy[i]=10*xy[i]
    
    totalTime=time.time()-start
    
    
    ## Saving data ##
    
    
    # Reshaping the wavelet coefficients to save
    wav_coeff=np.ravel(wav_coeff,order='F')
    wav_coeff=np.reshape(wav_coeff,(nScales,nTimeSlices,nNodes))
    
    DIR_=os.path.join('front','results',name)
    
    if (not os.path.exists(DIR_)):
        os.makedirs(DIR_)
        
    fjoin=lambda name:os.path.join(DIR_,name)
    
    util.save_array_json(fjoin('wav_coeff.json'),wav_coeff)
    util.save_array_json(fjoin('f.json'),f)
    
    util.save_list_json(fjoin('time_labels.json'),time_labels)
    util.save_list_json(fjoin('time_labels_per_hour.json'),time_labels_per_hour)
    
    util.save_array_json(fjoin('node_class.json'),node_class)

    util.save_array_json(fjoin('f_network.json'),f_network)
    util.save_array_json(fjoin('network_class.json'),network_class)
    
    for tm in range(nTimeSlices):
        util.save_edges(fjoin('edges_'+str(tm)+'.json'),edges[tm])
        
    # Use short name to the node ranking
    if (name == 'imdb1'):
        short_name=[node_labels[i].split(',')[0] for i in range(nNodes)]
    else:
        short_name=None
    
    file_nodes=folder+'nodes_'+name+'.json'
    nodes_saved=os.path.exists(file_nodes)
    
    if (rebuild_layout or (not nodes_saved)):
        util.save_nodes(fjoin('nodes.json'),xy,'name',node_labels,short_name)
        util.save_nodes(file_nodes,xy,'name',node_labels,short_name)
    else:
        shutil.copy(file_nodes,'front/results/'+name)
        code=os.getcwd()
        os.chdir('front/results/'+name)
        if ('nodes.json' in os.listdir('.')):
            os.remove('nodes.json')
        os.rename('nodes_'+name+'.json','nodes.json')
        os.chdir(code)            

    if (name == datasets_to_run[-1]):
        DIR_=os.path.join('front','results')
        cases=os.listdir(DIR_)
        if ('cases.json' in cases):
            cases.remove('cases.json')
        
        cases.sort()
        
        with open(os.path.join(DIR_,'cases.json'),'w') as outfile:
            outfile.write("[\n")
            for case in cases:
                outfile.write("{\n")
                outfile.write('"name": "'+case+'",\n')
                outfile.write('"dir": "results/'+case+'/"\n')
                if (case == cases[-1]):
                    outfile.write("}\n")
                else:
                    outfile.write("},\n")
            outfile.write("]")
    
    
    ## Printing some information and processing time ##
    
    
    nEdges=0
    for edge in edges:
        if (edge != [[None,None]]):
            nEdges+=len(edge)
    
    print('\n'+name)
    print('---------------------------------------------------')
    print('Total time: {0:4g}s'.format(totalTime))
    print('Approximation of the wavelet coefficients: {0:4g}s'.format(app_time))
    print('---------------------------------------------------')
    print('Nodes: %.d'%nNodes)
    print('Edges: %.d'%nEdges)
    print('Time slices: %.d'%nTimeSlices)
    print('---------------------------------------------------')