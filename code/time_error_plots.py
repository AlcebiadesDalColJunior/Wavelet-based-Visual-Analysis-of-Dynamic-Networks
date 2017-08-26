import numpy as np
import matplotlib.pyplot as plt


name='synthetic'

M_array=[10,20,30,40,50,60]
nM=len(M_array)

app_time=np.loadtxt('app_time_'+name)
app_error=np.loadtxt('app_error_'+name)

rang=range(1,1+nM)

plt.figure()
plt.title('Time',fontsize=25)
plt.plot(rang,app_time,linewidth=5)
plt.plot(rang,app_time,'bo',markersize=15)
plt.xticks(rang,M_array,fontsize=20,color='k')
plt.yticks(fontsize=20,color='k')
plt.grid(False)
plt.show()

plt.figure()
plt.title('Error',fontsize=25)
plt.plot(rang,app_error,linewidth=5)
plt.plot(rang,app_error,'bo',markersize=15)
plt.xticks(rang,M_array,fontsize=20,color='k')
plt.yticks(fontsize=20,color='k')
plt.grid(False)
plt.show()