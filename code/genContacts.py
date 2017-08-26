from __future__ import division


def get_key(item):
    return(item[0])


# Desired interval in minutes
interval=6

weight_same_class=1
weight_different_class=1

datasets_to_run='all'

if (datasets_to_run == 'all'):
    datasets_to_run=['thiers_2011','thiers_2012','thiers_2013','primary_school',
                     'hospital']
                     
if type(datasets_to_run) is not list:
        datasets_to_run=[datasets_to_run]

source='sources/'
folder='datasets/'

time_step=20
step=(60*interval)//time_step

for name in datasets_to_run:
    contacts=[]
    with open(source+name+'.csv','r') as inFile:
            for line in inFile:
                contacts.append(line.split())
    
    nContacts=len(contacts)
    
    for j in range(3):
        for i in range(nContacts):
            contacts[i][j]=int(contacts[i][j])
    
    t0=contacts[0][0]
    tf=contacts[-1][0]
    
    node_labels=[]
    for i in range(nContacts):
        node_labels.append(contacts[i][1])
        node_labels.append(contacts[i][2])
        
    node_labels=list(set(node_labels))
    node_labels.sort()
    
    nNodes=len(node_labels)
    
    classes=[]
    for i in node_labels:
        index=0
        
        while ((contacts[index][1] != i) and (contacts[index][2] != i)):
            index+=1
        
        if (contacts[index][1] == i):
            classes.append([i,contacts[index][3]])
        else:
            classes.append([i,contacts[index][4]])
    
    classes=sorted(classes,key=get_key)
    
    for i in range(nContacts):
        contacts[i]=[int(contacts[i][0]),(int(contacts[i][1]),int(contacts[i][2]))]
    
    for i in range(nContacts):
        contacts[i][0]=(contacts[i][0]-t0)//time_step
    
    nSamples=((tf-t0)//time_step)+1
    
    samples=[]
    for i in range(nSamples):
        samples.append([])
    
    for i in range(nContacts):
        samples[contacts[i][0]].append(contacts[i][1])
    
    for i in range(nSamples):
        if (samples[i] != []):
            for j in range(len(samples[i])):
                node0=node_labels.index(samples[i][j][0])
                node1=node_labels.index(samples[i][j][1])
                
                samples[i][j]=(node0,node1)
        else:
            samples[i]=[[None,None]]
    
    for i in range(nNodes):
        classes[i]=classes[i][1]
        
    for i in range(nNodes):
        if classes[i] in ['teacher','Teachers']:
            classes[i]='TCH'
            
        if classes[i] in ['MP*1','MP*2','PSI*']:
            classes[i]=classes[i].replace('*','')
            
        if classes[i] in ['2BIO1', '2BIO2', '2BIO3']:
            classes[i]=classes[i][1:]
    
    nTimeSlices=((tf-t0)//(60*interval))+1
    
    times_evenly_sampled=range(0,nTimeSlices*step,step)
    
    # Defining edges and spatial weight
    index=0
    edges=[]
    edge_weights=[]
    weights=dict()
    for i in times_evenly_sampled:
        samples_in_range=[]
        for j in range(i-step,i+1):
            if (0 <= j < nSamples):
                for sample in samples[j]:
                    samples_in_range.append(sample)
    
        while ([None,None] in samples_in_range):
            samples_in_range.remove([None,None])
        
        for sample in samples_in_range:
            node0,node1=sample
            current_edge=((node0,index),(node1,index))
            
            if (current_edge not in weights):
                weights[current_edge]=0
                
            if (classes[node0] == classes[node1]):
                weights[current_edge]+=weight_same_class
            else:
                weights[current_edge]+=weight_different_class
        
        samples_in_range=list(set(samples_in_range))
        
        edge_weights.append([])
        if (samples_in_range == []):
            edges.append([None])
            edge_weights[index].append(None)
        else:
            edges.append(samples_in_range)
            for edge in edges[index]:
                edge_weights[index].append(weights[((edge[0],index),(edge[1],index))])
        
        index+=1
    
    # Defening time labels
    weekdays=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday']
    
    start_day=dict()
    start_day['thiers_2011']=3
    start_day['thiers_2012']=2
    start_day['thiers_2013']=2
    start_day['primary_school']=5  
    start_day['hospital']=2
    current_day=start_day[name]
    
    start_time=dict()
    start_time['thiers_2011']='8:00'
    start_time['thiers_2012']='8:00'
    start_time['thiers_2013']='8:00'
    start_time['primary_school']='8:45'
    start_time['hospital']='13:00'
    current_time=start_time[name]
    
    time_labels=[[] for i in range(nTimeSlices)]
    time_labels_per_hour=[0 for i in range(nTimeSlices)]
    
    for i in range(nTimeSlices):
        time_labels_per_hour[i]=current_time
        
        time_labels[i]=weekdays[current_day]
        
        hour,minutes=current_time.split(':')
        
        hour=int(hour)
        
        if (minutes[0] == '0'):
            minutes=int(minutes[1])
        else:
            minutes=int(minutes[0]+minutes[1])
        
        minutes+=interval
        
        if (minutes >= 60):
            minutes-=60
            hour+=1
            
        if (hour == 24):
            hour=0
            current_day+=1
            
        if (current_day == 7):
            current_day=0
            
        if (minutes <= 9):
            current_time=str(hour)+':'+'0'+str(minutes)
        else: 
            current_time=str(hour)+':'+str(minutes)
    
    
    with open(folder+name+'_labels','w') as outFile:
        for i,cl in zip(node_labels,classes):
            outFile.write(str(i)+'\t'+cl+'\n')
    
    with open(folder+name+'_edges','w') as outFile:  
        for i in range(nTimeSlices):
            for j in range(len(edges[i])):
                outFile.write(str(edges[i][j]))
                if (j < len(edges[i])-1):
                    outFile.write(';')
                    
            outFile.write('\n')
    
    with open(folder+name+'_edge_weights','w') as outFile:
        for i in range(nTimeSlices):
            for j in range(len(edge_weights[i])):
                outFile.write(str(edge_weights[i][j]))
                if (j < len(edges[i])-1):
                    outFile.write(';')
            outFile.write('\n')
    
    with open(folder+name+'_times','w') as outFile:
        for i in range(nTimeSlices):
            outFile.write(str(time_labels[i])+'\n')
            
    with open(folder+name+'_times_per_hour','w') as outFile:
        for i in range(nTimeSlices):
            outFile.write(str(time_labels_per_hour[i])+'\n')