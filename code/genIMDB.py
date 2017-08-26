import numpy as np


def get_key(item):
    return(item[0])


nTop=400
initial_year=1980

source='sources/'
folder='datasets/'

movies=[]
with open(source+'imdb1.csv','r') as inFile:
    for line in inFile:
        movies.append(line.split('\t'))

# Taking header
header=movies.pop(0)
   
nMovies=len(movies)
for i in range(nMovies):
    movies[i][0]=int(movies[i][0])
    movies[i][1]=float(movies[i][1])
    movies[i][4]=movies[i][4].replace('\n','')
    movies[i][4]=movies[i][4].split(';')

# Ordering by year
movies=sorted(movies,key=get_key)

# Deleting movies before initial year
while (movies[0][0] < initial_year):
    del(movies[0])

nMovies=len(movies)

actors=[]
for i in range(nMovies):
    for actor in movies[i][4]:
        actors.append(actor)

actors=list(set(actors))
nTotalActors=len(actors)

movie_score=[]  
for i in range(nMovies):
    movie_score.append(movies[i][1])

actors_score=np.zeros((nTotalActors,))
for i in range(nMovies):
    for actor in movies[i][4]:
        actors_score[actors.index(actor)]+=movie_score[i]

# Selecting the top 400 actors according to rating
index=actors_score.argsort()[-nTop:]

top_actors=[]
for i in index:
    top_actors.append(actors[i])

movies_with_top_actors=[[] for i in range(nMovies)]

for i in range(nMovies):
    movies_with_top_actors[i].append(movies[i][0])
    movies_with_top_actors[i].append([])
    for actor in movies[i][4]:
        if (actor in top_actors):
            movies_with_top_actors[i][1].append(actor)

time_labels=[]
for i in range(nMovies):
    time_labels.append(movies_with_top_actors[i][0])
    
time_labels=sorted(list(set(time_labels)))

nTimeSlices=len(time_labels)

time_labels_per_hour=time_labels[:]

# Top actors who don't act with some other top actor will be removed
active_actors=[]
for i in range(nMovies):
    nActors=len(movies_with_top_actors[i][1])
    
    if (nActors >= 2):
        for j in range(nActors):
            active_actors.append(top_actors.index(movies_with_top_actors[i][1][j]))

inactive_actors=list(set(range(nTop))-set(active_actors))
inactive_actors.sort(reverse=True) 

# Deleting inactive top actors
for i in inactive_actors:
    del(top_actors[i])

# Actors who acted in the same movie will be connected 
edges=[]
for i in range(nTimeSlices):
    edges.append([])

for i in range(nMovies):
    time=time_labels.index(movies_with_top_actors[i][0])
    
    nActors=len(movies_with_top_actors[i][1])
    for j in range(nActors):
        for k in range(j+1,nActors):
            node0=top_actors.index(movies_with_top_actors[i][1][j])
            node1=top_actors.index(movies_with_top_actors[i][1][k])
            edges[time].append((node0,node1))

edge_weights=[]
for i in range(nTimeSlices):
    edge_weights.append([])

all_edges=[]
for i in range(nTimeSlices):
    all_edges.append(edges[i][:])

# Removing duplicate edges
for i in range(nTimeSlices):
    edges[i]=list(set(edges[i]))
    
for i in range(nTimeSlices):
    weights=dict()
    for edge in edges[i]:
        weights[edge]=all_edges[i].count(edge)
    
    for edge in edges[i]:
        edge_weights[i].append(weights[edge])

for i in range(nTimeSlices):
    if (edges[i] == []):
        edges[i]=[None]
        edge_weights[i]=[None]


with open(folder+'imdb1_labels','w') as outFile:
    for actor in top_actors:
        outFile.write(str(actor)+'\n')

with open(folder+'imdb1_edges','w') as outFile:
    for i in range(nTimeSlices):
        for j in range(len(edges[i])):
            outFile.write(str(edges[i][j]))
            if (j < len(edges[i])-1):
                outFile.write(';')
        outFile.write('\n')
        
with open(folder+'imdb1_edge_weights','w') as outFile:
    for i in range(nTimeSlices):
        for j in range(len(edge_weights[i])):
            outFile.write(str(edge_weights[i][j]))
            if (j < len(edges[i])-1):
                outFile.write(';')
        outFile.write('\n')

with open(folder+'imdb1_times', 'w') as outFile:
    for i in range(nTimeSlices):
        outFile.write(str(time_labels[i])+'\n')
        
with open(folder+'imdb1_times_per_hour','w') as outFile:
    for i in range(nTimeSlices):
        outFile.write(str(time_labels_per_hour[i])+'\n')