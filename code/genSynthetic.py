import numpy as np

from random import choice
from sklearn.neighbors import NearestNeighbors


source='sources/'
folder='datasets/'

nNodes=250
nTimeSlices=13

edges=[[] for i in range(nTimeSlices)]

pos=np.loadtxt(source+'synthetic_positions.csv')

nbrs=NearestNeighbors(n_neighbors=nNodes,algorithm='ball_tree').fit(pos)

distances,indices=nbrs.kneighbors(pos)

# First major events
nodes=[166,58]
times=[1,1]
for i in range(len(nodes)):
    index=0
    selected_node=nodes[i]
    initial_time=times[i]
    
    sizes=[1,3,6,7,6,3,1]
    for time in range(initial_time,initial_time+len(sizes)):
        size=sizes[index]

        for j in range(1,1+3):
            current_neighbor=indices[selected_node][j]
            edges[time].append((selected_node,current_neighbor))
            
            if (size >= 2):
                for j1 in range(2,4):
                    current_neighbor_j1=indices[current_neighbor][j1]
                    edges[time].append((current_neighbor,current_neighbor_j1))
                    
                    if (size >= 3):
                        for j2 in range(4,6):
                            current_neighbor_j2=indices[current_neighbor_j1][j2]
                            edges[time].append((current_neighbor_j1,current_neighbor_j2))
                            
                            if (size >= 4):
                                for j3 in range(4,6):
                                    current_neighbor_j3=indices[current_neighbor_j2][j3]
                                    edges[time].append((current_neighbor_j2,current_neighbor_j3))
                            
                                    if (size >= 5):
                                        for j4 in range(5,7):
                                            current_neighbor_j4=indices[current_neighbor_j3][j4]
                                            edges[time].append((current_neighbor_j3,current_neighbor_j4))
                                            
                                            if (size >= 6):
                                                for j5 in range(5,7):
                                                    current_neighbor_j5=indices[current_neighbor_j4][j5]
                                                    edges[time].append((current_neighbor_j4,current_neighbor_j5))
                                                    
                                                    if (size == 7):
                                                        for j6 in range(6,8):
                                                            current_neighbor_j6=indices[current_neighbor_j5][j6]
                                                            edges[time].append((current_neighbor_j5,current_neighbor_j6))
                                
        index+=1

# Small fixed events
nodes=[141,226,32,214,10,132,121,165,63,220,198,135,86,34,189,59,21,136,42,206,6,24,162,107,160,195]
for k in range(7,10):
    times=[k for i in range(len(nodes))]
    for i in range(len(nodes)):
        index=0
        selected_node=nodes[i]
        initial_time=times[i]
        
        for time in range(initial_time,initial_time+1):
            for j in range(1,1+choice([4,5,6])):
                current_neighbor=indices[selected_node][j]
                edges[time].append((selected_node,current_neighbor))
            
            index+=1
            
    nodes.pop()
    nodes.pop()
    nodes.pop()
    nodes.pop()

# Second major events
nodes=[32,172]
times=[10,10]
for i in range(len(nodes)):
    index=0
    selected_node=nodes[i]
    initial_time=times[i]
    
    sizes=[6,7,6]
    for time in range(initial_time,initial_time+len(sizes)):
        size=sizes[index]

        for j in range(1,4):
            current_neighbor=indices[selected_node][j]
            edges[time].append((selected_node,current_neighbor))
            
            for j1 in range(2,4):
                current_neighbor_j1=indices[current_neighbor][j1]
                edges[time].append((current_neighbor,current_neighbor_j1))
                
                for j2 in range(4,6):
                    current_neighbor_j2=indices[current_neighbor_j1][j2]
                    edges[time].append((current_neighbor_j1,current_neighbor_j2))
                    
                    for j3 in range(4,6):
                        current_neighbor_j3=indices[current_neighbor_j2][j3]
                        edges[time].append((current_neighbor_j2,current_neighbor_j3))
                
                        for j4 in range(5,7):
                            current_neighbor_j4=indices[current_neighbor_j3][j4]
                            edges[time].append((current_neighbor_j3,current_neighbor_j4))
                            
                            for j5 in range(5,7):
                                current_neighbor_j5=indices[current_neighbor_j4][j5]
                                edges[time].append((current_neighbor_j4,current_neighbor_j5))
                                
                                if (size == 7):
                                    for j6 in range(6,8):
                                        current_neighbor_j6=indices[current_neighbor_j5][j6]
                                        edges[time].append((current_neighbor_j5,current_neighbor_j6))
            
        index+=1            
            
for i in range(nTimeSlices):
    for j in range(len(edges[i])):
        if (edges[i][j][0] > edges[i][j][1]):
            edges[i][j]=(edges[i][j][1],edges[i][j][0])

for i in range(nTimeSlices):
    repeated_elements=set([e for e in edges[i] if edges[i].count(e)>1])
    while (repeated_elements != set()):
        for element in list(repeated_elements):
            j=edges[i].index(element)
            del(edges[i][j])
            
        repeated_elements=set([e for e in edges[i] if edges[i].count(e) > 1])

for i in range(nTimeSlices):
    if (edges[i] == []):
        edges[i]=[None]


with open(folder+'synthetic_labels','w') as outFile:
    for i in range(nNodes):
        outFile.write(str(i)+'\n')
        
with open(folder+'synthetic_edges','w') as outFile:  
    for i in range(len(edges)):
        for j in range(len(edges[i])):
            outFile.write(str(edges[i][j]))
            if (j < len(edges[i])-1):
                outFile.write(';')
        outFile.write('\n')