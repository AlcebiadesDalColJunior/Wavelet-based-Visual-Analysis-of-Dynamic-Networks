"""
Adaptation of SnapshatToPoints: van den Elzen, Stef, et al.
"Reducing snapshots to points: A visual analytics approach to
dynamic network exploration." Visualization and Computer Graphics,
IEEE Transactions on 22.1 (2016): 1-10.

@author: paola lv, alcebiades dal col
"""


from __future__ import division

import json
from math import sin,cos,pi,sqrt

from matplotlib.widgets import Slider

import matplotlib.gridspec as gridspec
import matplotlib.pyplot as plt
import matplotlib.colors as mplc

from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.neighbors import KDTree

from sklearn.preprocessing import scale
from sklearn.preprocessing import MinMaxScaler

import numpy as np
import networkx as nx

import util
from conf import getConf


def drawPhyllotacticPattern(nOverlapping,xcenter,ycenter,angle=137.508,cspread=0.04):
        """Print a pattern of circles using spiral phyllotactic data"""
        phi=angle*(pi/180.0)
        
        x=[]
        y=[]        
        for i in range(nOverlapping):
            r=cspread*sqrt(i)
            theta=phi*i
                
            x.append(r*cos(theta)+xcenter)
            y.append(r*sin(theta)+ycenter)
                
        return(x,y)

class SnapshatToPointsGui(object):
    def __init__(self,G_array,xy,f,projection):
        self.init_visual_properties()
        
        self.G_array=G_array
        self.xy=xy
        self.f=f
        self.nTimeSlices=len(self.G_array)
        self.proj=projection
        self.selectedTime=0
        
        vmin=np.min(self.f)
        vmax=np.max(self.f)
        
        self.norm=mplc.Normalize(vmin=vmin,vmax=vmax)
        
        self.remove_overlay()
                    
        self._proj_tree=KDTree(self.proj,leaf_size=4)
        
        self.fig=plt.figure()
        self.fig.patch.set_facecolor('white')
        
        self.ax_projection=self.fig.add_axes([0.01,0.01,0.49,0.96])
        self.ax_cb_proj=self.fig.add_axes([0.03,0.045,0.3,0.015]) 
        
        gs2=gridspec.GridSpec(2,1,height_ratios=[10,1])
        gs2.update(left=0.52,right=0.96,hspace=0.05)
        
        self.ax_graph=self.fig.add_axes([0.51,0.01,0.48,0.96])
        self.ax_time=self.fig.add_axes([0.53,0.045,0.30,0.015])
        
        self._timeSlider=Slider(self.ax_time,'',0,self.nTimeSlices-1,valinit=self.selectedTime,valfmt='%0.0f')
        self._timeSlider.label.set_color('#000000')
        self._timeSlider.valtext.set_color('#000000')
        self._timeSlider.poly.set_facecolor('#bbbbbb')
                
        # Connect events        
        self._timeSlider.on_changed(self.updateTime)
        self.fig.canvas.mpl_connect('button_press_event',self.click)
        self.fig.canvas.mpl_connect('key_press_event',self.press)
        
        self.plotGraph()
        self.plotProjection()
        
    def init_visual_properties(self):
        self._vis_graph=dict()
        self._vis_graph['alpha']=0.8
        self._vis_graph['bgcolor']='white'
        self._vis_graph['cmap']=plt.cm.Greens
        self._vis_graph['edges_color']='#333333'
        self._vis_graph['edges_width']=1
        self._vis_graph['node_size']=100
        self._vis_graph['nodes_stroke']='#000000'

        self._vis_proj=dict()
        self._vis_proj['alpha']=0.8
        self._vis_proj['bgcolor']='white'
        self._vis_proj['cmap']=plt.cm.YlGnBu
        self._vis_proj['line_color']='#888888'
        self._vis_proj['line_width']=1
        self._vis_proj['node_size']=50
        self._vis_proj['nodes_stroke']='#333333'
        self._vis_proj['nodes_stroke_width']=0.8
        self._vis_proj['selected_stroke']='#880000'
        self._vis_proj['selected_stroke_width']=4
        self._vis_proj['selected_size']=70
                
    def remove_overlay(self):
        proj=np.round(self.proj,decimals=8)
        
        # Vectorization of projection points
        vectors=[]
        for i in range(self.nTimeSlices):
            vectors.append((proj[i,0],proj[i,1]))
            
        overlays=dict()
        for i in range(self.nTimeSlices):
            if (vectors[i] not in overlays):
                overlays[vectors[i]]=1
            else:
                overlays[vectors[i]]+=1
        
        for vec in overlays.keys():
            new_x,new_y=drawPhyllotacticPattern(overlays[vec],vec[0],vec[1])
            
            index=0
            for i in range(self.nTimeSlices):
                if (vectors[i] == vec):
                    self.proj[i,0]=new_x[index]
                    self.proj[i,1]=new_y[index]
                    index+=1
                    
    def plotGraph(self):
        """Graph plot"""
        G=self.G_array[self.selectedTime]
        
        self.nodesG=nx.draw_networkx_nodes(G,self.xy,
                            node_color=self.f[self.selectedTime,:],
                            node_size=self._vis_graph['node_size'],
                            with_labels=False,cmap=self._vis_graph['cmap'],
                            norm=self.norm,alpha=self._vis_graph['alpha'],
                            linewidths=0.25,
                            ax=self.ax_graph)
                            
        self.nodesG.set_edgecolor(self._vis_graph['nodes_stroke'])
        
        self.edgesG=nx.draw_networkx_edges(G,self.xy, 
                            width=self._vis_graph['edges_width'],arrows=False,
                            edge_color=self._vis_graph['edges_color'],
                            ax=self.ax_graph)
                            
        self.ax_graph.set_xticklabels([])
        self.ax_graph.set_yticklabels([])
        
        self.ax_graph.grid(False)
        self.ax_graph.axis('equal')
        
        plt.draw()
        
    def plotProjection(self):
        """ Graph plot """
        self.ax_projection.clear()     
        self.ax_projection.plot(self.proj[:,0],self.proj[:,1],
                            color=self._vis_proj['line_color'],
                            linewidth=self._vis_proj['line_width'],zorder=1)
                            
        splot=self.ax_projection.scatter(self.proj[:,0],self.proj[:,1],s=20,
                            c=range(self.nTimeSlices),cmap=self._vis_proj['cmap'],
                            edgecolors=self._vis_proj['nodes_stroke'],
                            linewidth=self._vis_proj['nodes_stroke_width'],
                            alpha=self._vis_proj['alpha'],zorder=2)
                            
        self.ax_projection.grid(False)
        self.ax_projection.axis('equal')
        
        cbar=plt.colorbar(splot,cax=self.ax_cb_proj,orientation='horizontal')
        cbar.solids.set_edgecolor("face")
        cbar.outline.set_linewidth(0.25)
        cbar.set_ticks([])
        
        self.ax_projection.set_xticklabels([])
        self.ax_projection.set_yticklabels([])
        
        self.circle_current_time=self.ax_projection.scatter(
                            [self.proj[self.selectedTime,0]],
                            [self.proj[self.selectedTime,1]],
                            s=self._vis_proj['selected_size'],
                            edgecolors=self._vis_proj['selected_stroke'],
                            facecolors='none',
                            linewidth=self._vis_proj['selected_stroke_width'],
                            zorder=3)

        plt.draw()
            
    def updateTime(self,event):        
        self.selectedTime=int(np.round(self._timeSlider.val))        
        self.updateGraphPlot()

        self.circle_current_time.set_offsets([self.proj[self.selectedTime,0],
                                           self.proj[self.selectedTime,1]])
        plt.draw()
        
    def updateGraphPlot(self):
        """Update nodes and edges of selected graph"""
        G=self.G_array[self.selectedTime]
        self.nodesG.set_facecolors(self._vis_graph['cmap'](self.norm(self.f[self.selectedTime,:])))
        if (self.edgesG):
            self.edgesG.remove()
        self.edgesG=nx.draw_networkx_edges(G,self.xy,width=1,arrows=False,
                            edge_color='gray',ax=self.ax_graph)

    def click(self,event):
        """
        What to do, if a click on the figure happens:
            1. Check which axis
            2. Get data coord's
            3. Update Graph and Slider
        """
        if (event.inaxes == self.ax_projection):
            dist,ind=self._proj_tree.query(np.array([event.xdata,event.ydata],ndmin=2),k=1)
            self._timeSlider.set_val(ind)
            
        plt.draw()
        
    def press(self,event):
        if (event.key == 'right'):
            nt=int(np.round(self._timeSlider.val))+1
            if (nt < self.nTimeSlices):
                self._timeSlider.set_val(nt)
            
        if (event.key == 'left'):
            nt=int(np.round(self._timeSlider.val))-1
            if (0 <= nt):
                self._timeSlider.set_val(nt)

class SnapshatToPoints(object):
    def __init__(self,G_array,projection_type='pca',normalization=None,projection_attrs=None):
        self._normalization=normalization
        self.set_G_array(G_array)
        self.set_projection_type(projection_type,projection_attrs)
       
    def set_G_array(self,G_array):
        self._G_array=G_array
        self._n_nodes=G_array[0].number_of_nodes()
        self._n_edges=self._n_nodes*self._n_nodes
        self._n_graphs=len(G_array)
        self.buildAdjMatrix()
        
    def buildAdjMatrix(self):
        self._A_matrix=np.zeros((self._n_graphs,self._n_edges))
        
        for i,G in enumerate(self._G_array):
            A=nx.adj_matrix(G).toarray().flatten()
            self._A_matrix[i,:]=A
        
        if (self._normalization == 'min-max'):
            print('min-max')
            min_max_scaler=MinMaxScaler()
            self._A_matrix=min_max_scaler.fit_transform(self._A_matrix)
        elif (self._normalization == 'z-score'):
            print('z-score')
            self._A_matrix=scale(self._A_matrix)
        
    def projection(self):
        return(self._projection)
        
    def project(self,projection_attrs=None):
        if (self._projection_type == 'pca'):
            self._projection=self.project_pca()
            
        if (self._projection_type == 'rpca'):
            self._projection=self.project_rpca()
            
        if (self._projection_type == 'tsne'):
            self._projection=self.project_tsne(projection_attrs)
            
        if (self._projection_type == 'time_pca'):
            self._projection=self.project_time_pca()
            
    def set_projection_type(self,proj,projection_attrs=None):
        self._projection_type=proj
        self.project(projection_attrs)
        
    def project_pca(self):   
        pca=PCA(n_components=2)
        pca.fit(self._A_matrix.T)
        pca_proj=pca.components_.T
        
        return(pca_proj)
    
    def project_rpca(self):   
        pca=PCA(n_components=2,svd_solver='randomized')
        pca.fit(self._A_matrix.T)
        pca_proj=pca.components_.T
        
        return(pca_proj)
        
    def project_tsne(self,projection_attrs):   
        data=self._A_matrix
        
        if (projection_attrs):
            if (projection_attrs['pca']):
                pca=projection_attrs['pca']
                
            if (projection_attrs['perplexity']):
                perplexity=projection_attrs['perplexity']
                
            if (projection_attrs['theta']):
                theta=projection_attrs['theta']
        else: # Standard configuration
            perplexity=30.0
            theta=0.5
            pca=False
            
        if (pca and data.shape[0] > 50):
            pca=PCA(n_components=50)
            pca.fit(data.T)
            data=pca.components_[0:50,:].T 
            
        tsne=TSNE(n_components=2,perplexity=perplexity,method='barnes_hut',
                    angle=theta,learning_rate=1000)
        tsne.fit(data)
        tsne_proj=tsne.embedding_[:,0:2]
     
        return(tsne_proj)
        
    def project_time_pca(self):
        pca=PCA(n_components=2)
        pca.fit(self._A_matrix.T)
        pca_proj=np.column_stack((np.array(range(self._n_graphs)),pca.components_[0:1,:].T))
        
        return(pca_proj)


def _load_data(folder,name):   
    basename=folder+name
    conf=getConf(name)
    
    node_labels,classes=util.load_nodes(basename,conf)
    
    nNodes=len(node_labels)
    
    edges=util.load_edges(basename)
    
    nTimeSliceslices=len(edges)   
        
    if (conf.read_edge_weights):
        weights=util.load_edge_weights(basename)
       
    G_array=[]
    f=np.zeros((nTimeSliceslices,nNodes))
    for i in range(nTimeSliceslices):
        G=nx.empty_graph(nNodes)
        edge_weights=[]
        if (edges[i] != [[None,None]]):
            for j in range(len(edges[i])):
                node0=edges[i][j][0]
                node1=edges[i][j][1]
                
                if (conf.read_edge_weights):
                    edge_weights.append((node0,node1,weights[i][j]))
                else:
                    edge_weights.append((node0,node1,1))

            G.add_weighted_edges_from(edge_weights)
            
        G_array.append(G)
        f[i,:]=list(G.degree(weight='weight').values())
          
    xy=json.loads(open('datasets/nodes_'+name+'.json').read())['nodes']
    
    pos=dict()
    for i in range(nNodes):
        pos[i]=np.array([xy[i]['x'],xy[i]['y']])
        
    return(G_array,f,pos)
    

if (__name__ == '__main__'):
    folder='datasetsRSP/'
    
    # Names:
    #'synthetic'
    #'thiers_2011'
    #'thiers_2012'
    #'thiers_2013'
    #'primary_school'
    #'hospital'
    #'imdb1'
    
    name='synthetic'
        
    G_array,f,pos=_load_data(folder,name)
    
    # Projection types: 'pca', 'rpca', 'time_pca', and 'tsne'
    projection_type='pca'
    
    # Normalizations: 'min-max', and 'z-score'
    normalization='none'
    
    # Configuration for tsne projection (standard)
    projection_attrs={'perplexity':30,'theta':0.5,'pca':True}
    
    stp=SnapshatToPoints(G_array,projection_type=projection_type,
                         normalization=normalization,
                         projection_attrs=projection_attrs)        
                         
    projection=stp.projection()[:]
    
    # Rescale
    projection=4*scale(projection)

    SnapshatToPointsGui(G_array,pos,f,projection)