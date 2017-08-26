def getConf(datasetNumber):
    conf=lambda:None
    
    if (datasetNumber == 'Enter your filename'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = False
        conf.read_classes      = False
        conf.read_time_labels  = False
        conf.read_pos          = False
        conf.weight            = 0.0001
    elif (datasetNumber == 'synthetic'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = False
        conf.read_classes      = False
        conf.read_time_labels  = False
        conf.read_pos          = False
        conf.weight            = 0.00013  
    elif (datasetNumber == 'thiers_2011'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = True
        conf.read_classes      = True
        conf.read_time_labels  = True
        conf.read_pos          = False
        conf.weight            = 0.003
    elif (datasetNumber == 'thiers_2012'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = True
        conf.read_classes      = True
        conf.read_time_labels  = True
        conf.read_pos          = False
        conf.weight            = 0.0022
    elif (datasetNumber == 'thiers_2013'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = True
        conf.read_classes      = True
        conf.read_time_labels  = True
        conf.read_pos          = False
        conf.weight            = 0.0009  
    elif (datasetNumber == 'primary_school'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = True
        conf.read_classes      = True
        conf.read_time_labels  = True
        conf.read_pos          = False
        conf.weight            = 0.0014 
    elif (datasetNumber == 'hospital'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = True
        conf.read_classes      = True
        conf.read_time_labels  = True
        conf.read_pos          = False
        conf.weight            = 0.006  
    elif (datasetNumber == 'imdb1'):
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = True
        conf.read_classes      = False
        conf.read_time_labels  = True
        conf.read_pos          = False
        conf.weight            = 0.00008
    else: # Default configuration
        conf.temporal_weight   = 1.0
        conf.spatial_weight    = 1.0
        conf.read_signal       = False
        conf.read_edge_weights = False
        conf.read_classes      = False
        conf.read_time_labels  = False
        conf.read_pos          = False
        conf.weight            = 0.0001
        
    return(conf)