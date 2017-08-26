import json

import numpy as np
import networkx as nx


def load_nodes(filename,conf):
    node_labels=[]
    classes=[]
    with open(filename+'_labels','r') as inFile:
        for line in inFile:
            line=line.split('\t')
            node_labels.append(line[0].replace('\n',''))
            
            if (conf.read_classes):
                classes.append(line[1].replace('\n',''))
                
    nNodes=len(node_labels)
                
    if (conf.read_classes):
        for i in range(nNodes):                
            node_labels[i]=node_labels[i]+', '+classes[i]  
            
    if (classes == []):
        classes=['undefined' for i in range(nNodes)]
                
    return(node_labels,classes)

def load_edges(filename):
    edges=[]
    with open(filename+'_edges','r') as inFile:
        for line in inFile:
            line=line.replace('\n','').split(';')
            if (line[0] == 'None'):
                edges.append([[None,None]])
            else:
                for i in range(len(line)):
                    node0,node1=line[i].split(',')
                    
                    node0=node0.replace('(','')
                    node1=node1.replace(')','')
                    
                    line[i]=(int(node0),int(node1))
                
                edges.append(line)
            
    return(edges)
    
def load_edge_weights(filename):
    weights=[]
    with open(filename+'_edge_weights','r') as inFile:
        for line in inFile:
            weights.append(line.replace('\n','').split(';'))
            
    nTimeSlices=len(weights)
    for i in range(nTimeSlices):
            for j in range(len(weights[i])):
                if (weights[i][j] != 'None'):
                    weights[i][j]=int(weights[i][j])
                else:
                    weights[i]=[]
    
    return(weights)

def load_time_labels(filename):
    time_labels=[]
    with open(filename+'_times','r') as inFile:
        for line in inFile:
            time_labels.append(line.replace('\n',''))
    
    time_labels_per_hour=[]
    with open(filename+'_times_per_hour','r') as inFile:
        for line in inFile:
            time_labels_per_hour.append(line.replace('\n',''))
            
    return(time_labels,time_labels_per_hour)
    
def load_pos(filename):
    input_pos=[]
    with open(filename+'_pos','r') as inFile:
        for line in inFile:
            input_pos.append(line.replace('\n','').split('\t'))
    
    nNodes=len(input_pos)
    for i in range(nNodes):
        for j in range(2):
            input_pos[i][j]=float(input_pos[i][j])
            
    pos=np.zeros((nNodes,2))
    for i in range(nNodes):
        pos[i,0]=input_pos[i][0]
        pos[i,1]=input_pos[i][1]
        
    return(pos)


def path_graph_weighted(n,weights=1):
    G=nx.empty_graph(n)
    if (isinstance(weights,(int,float))):
        G.add_edges_from([(v,v+1) for v in range(n-1)],weight=weights)
    else:
        for v in range(n-1):
            G.add_edge(v,v+1,weight=weights[v])
            
    return(G)


def save_list_json(name,nplist):
    with open(name,'w') as outfile:
        json.dump(nplist,outfile)

def save_array_json(name,nparray):
    with open(name,'w') as outfile:
        json.dump(nparray.tolist(),outfile)

def save_nodes(name,xy,label_name,labels,short_name=None):
    nNodes=len(xy)
    if (short_name is None):
        node_dic=[{"x":xy[n][0],"y":xy[n][1],label_name:labels[n]} for n in range(nNodes)]
    else:
        node_dic=[{"x":xy[n][0],"y":xy[n][1],label_name:labels[n],"shortname":short_name[n]} for n in range(nNodes)]
        
    with open(name,'w') as outfile:
        json.dump({'nodes':node_dic},outfile)

def save_edges(name,edges):
    with open(name,'w') as outfile:
        json.dump({'links':list(map(lambda e:{ "source":e[0],"target":e[1]},edges))},outfile)