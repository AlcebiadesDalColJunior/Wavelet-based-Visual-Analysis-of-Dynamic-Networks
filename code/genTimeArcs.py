import util

datasets_to_run=['synthetic','thiers_2012']

if (datasets_to_run == 'all'):
    datasets_to_run=['thiers_2011','thiers_2012','thiers_2013',
                     'primary_school','hospital']
                     
if type(datasets_to_run) is not list:
        datasets_to_run=[datasets_to_run]

folder='datasets/'

for dataset in datasets_to_run:
    name=dataset
    basename=folder+name
    
    edges=util.load_edges(basename)
    
    nTimeSlices=len(edges)
            
    header=['Time','Color','Edge','Label']

    time_arcs=[]
    for i in range(nTimeSlices):
        for edge in edges[i]:
            if (edge != [None,None]):
                node0=str(edge[0])
                node1=str(edge[1])
                label='('+node0+','+node1+')'
                time_arcs.append([str(i),'Blue',node0,node1,label])
    
    
    with open('frontTimeArcs/data/'+name+'.tsv','w') as inFile:
        for i in range(len(header)):
            inFile.write(header[i])
            inFile.write('\t')
                
        inFile.write("\n")
        
        for i in range(len(time_arcs)):
            for j in range(len(time_arcs[i])):
                inFile.write(time_arcs[i][j])
                if (j <= 3):
                    if (j == 2):
                        inFile.write(";")
                    else:
                        inFile.write("\t")
            inFile.write("\n")